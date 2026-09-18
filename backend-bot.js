const { chromium } = require("playwright-extra");
const stealth = require("puppeteer-extra-plugin-stealth")();
const WebSocket = require("ws");
const https = require("https");
const fs = require("fs");
const path = require("path");

// Register stealth plugin
chromium.use(stealth);

// ========================= FIXED CONFIG =========================
const CREDENTIALS = {
  PHONE: process.env.WINGO_PHONE || "9056822671",
  PASSWORD: process.env.WINGO_PASSWORD || "Sourav123",
};
const API_BASE = "https://wingo.yl.n3y.in";
const WS_URL = "wss://wingo.yl.n3y.in/api/ws?timer=30S";
const TIMER = "30S";
// =================================================================

// ========================= DB CONFIG ============================
const { PrismaClient } = require(path.join(__dirname, 'backend', 'node_modules', '@prisma', 'client'));
const prisma = new PrismaClient();

let activeSchedules = [];
let globalOptions = {};
let currentSessionId = null; 

let currentStrategy = null;
let currentTimeSlot = null;

let sessionWins = 0;
let sessionLosses = 0;
let isSessionPaused = false; 

async function loadConfig() {
  try {
    const schedules = JSON.parse(process.env.ACTIVE_SCHEDULES || '[]');
    globalOptions = JSON.parse(process.env.GLOBAL_OPTIONS || '{}');
    
    for (const sched of schedules) {
      if (sched.timeSlotId && sched.strategyId) {
        const ts = await prisma.timeSlot.findUnique({ where: { id: sched.timeSlotId } });
        const st = await prisma.strategy.findUnique({ where: { id: sched.strategyId } });
        if (ts && st) {
          activeSchedules.push({ timeSlot: ts, strategy: st });
        }
      }
    }
    log(`✅ Loaded ${activeSchedules.length} active schedules.`);
    log(`[DEBUG] Initial globalOptions: ${JSON.stringify(globalOptions)}`);
  } catch (err) {
    log(`⚠️  Error loading config from DB: ${err.message}`);
  }
}

// Call once on startup
loadConfig();
// =================================================================

function log(msg) {
  const ts = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" }) + " IST";
  console.log(`[${ts}] ${msg}`);
}

let pendingBets = [];
let isDepositing = false;
let depositFailed = false;

if (process.send) {
  process.on('message', (msg) => {
    if (msg.type === 'UPDATE_OPTIONS') {
      globalOptions = { ...globalOptions, ...msg.data };
      log("🔄 Live updated global options: " + JSON.stringify(msg.data));
    } else if (msg.type === 'RETRY_DEPOSIT') {
      depositFailed = false;
      isDepositing = false;
      log("🔄 Retry deposit triggered by user.");
    }
  });
}

async function checkActiveSchedule() {
    const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const hh = String(nowIST.getHours()).padStart(2, '0');
    const mm = String(nowIST.getMinutes()).padStart(2, '0');
    const currentTime = `${hh}:${mm}`;
    
    let found = null;
    for (const sched of activeSchedules) {
        if (currentTime >= sched.timeSlot.startTime && currentTime <= sched.timeSlot.endTime) {
            found = sched;
            break;
        }
    }
    
    if (found?.timeSlot.id !== currentTimeSlot?.id) {
        if (currentSessionId) {
            await prisma.botSession.update({
                where: { id: currentSessionId },
                data: { status: 'COMPLETED' }
            });
            currentSessionId = null;
        }
        
        currentTimeSlot = found?.timeSlot || null;
        currentStrategy = found?.strategy || null;
        
        sessionWins = 0;
        sessionLosses = 0;
        isSessionPaused = false;
        
        if (currentTimeSlot && currentStrategy) {
            log(`🔄 Switched to Time Slot: ${currentTimeSlot.name}, Strategy: ${currentStrategy.name}`);
            const dateStr = nowIST.toISOString().split('T')[0];
            const session = await prisma.botSession.create({
                data: {
                    date: dateStr,
                    timeSlotId: currentTimeSlot.id,
                    timeSlotName: currentTimeSlot.name,
                    strategyId: currentStrategy.id,
                    strategyName: currentStrategy.name,
                    status: 'ACTIVE'
                }
            });
            currentSessionId = session.id;
        } else {
            log(`⏳ Current time ${currentTime} IST is outside all active time slots. Idle.`);
        }
    }
    return currentTimeSlot != null;
}

async function handleDepositFlow(page, context, balance) {
    if (isDepositing || depositFailed) return;
    isDepositing = true;
    log(`💸 Low balance (₹${balance}) detected. Initiating automated deposit flow...`);
    
    if (process.send) {
        process.send({ type: 'DEPOSIT_UPDATE', data: { status: 'NAVIGATING', address: null, failed: false } });
    }

    try {
        log("   Clicking back to home screen...");
        await page.locator('.navbar__content-left .van-icon-arrow-left').first().click({ timeout: 5000 });
        await page.waitForTimeout(2000);

        log("   Clicking Accounts tab...");
        await page.locator('.tabbar__container-item:has-text("Account")').first().click({ timeout: 5000 });
        await page.waitForTimeout(2000);

        log("   Clicking Deposit button...");
        await page.locator('.totalSavings__container-content-item:has-text("Deposit")').first().click({ timeout: 5000 });
        await page.waitForTimeout(2000);

        log("   Selecting USDT option...");
        await page.locator('.Recharge__container-tabcard__bot:has-text("USDT")').first().click({ timeout: 5000 });
        await page.waitForTimeout(1000);

        const amount = globalOptions.depositUsdtAmount || 10;
        log(`   Entering USDT amount: ${amount}`);
        await page.locator('.amount-input input').first().fill(String(amount));
        await page.waitForTimeout(1000);

        log("   Submitting deposit and waiting for new tab...");
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            page.locator('.Recharge__container-rechageBtn').first().click()
        ]);

        log("   New tab opened. Waiting for address...");
        await newPage.waitForLoadState('networkidle');
        
        const addressEl = newPage.locator('._address_span_1fhyb_295').first();
        await addressEl.waitFor({ state: 'visible', timeout: 15000 });
        const rawText = await addressEl.innerText();
        const address = rawText.trim();
        log(`   ✅ Extracted Address: ${address}`);

        if (process.send) {
            process.send({ type: 'DEPOSIT_UPDATE', data: { status: 'WAITING', address, failed: false } });
        }

        const waitMinutes = globalOptions.depositWaitTime || 5;
        log(`   ⏳ Waiting for ${waitMinutes} minutes for payment reflection...`);
        await page.waitForTimeout(waitMinutes * 60 * 1000);

        log("   Wait complete. Closing deposit tab...");
        await newPage.close();
        
        log("   Navigating back to game page...");
        await page.goto("https://bdg2030.com/#/login", { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(4000);
        
        try {
            const winGoCard = page.locator(".lotterySlotItem").filter({ hasText: "Win Go 30s" }).first();
            await winGoCard.click({ timeout: 5000 });
            log("   Clicked 'Win Go 30s'.");
        } catch (err) {
            log("   Could not find 'Win Go 30s' card after deposit: " + err.message);
        }
        await page.waitForTimeout(3000);

        isDepositing = false;
        log("   Deposit flow complete. Resuming normal operations.");
        
    } catch (err) {
        log(`   ❌ Deposit flow failed: ${err.message}`);
        isDepositing = false;
        depositFailed = true;
        if (process.send) {
            process.send({ type: 'DEPOSIT_UPDATE', data: { status: 'FAILED', address: null, failed: true } });
        }
    }
}

async function scrapeBalance(page, context) {
  try {
    let balanceText = null;
    let attempts = 0;
    
    // Poll the DOM for up to 20 seconds
    while (attempts < 20) {
        balanceText = await page.evaluate(() => {
            const el = document.querySelector('.Wallet__C-balance-l1');
            return el ? el.innerText : null;
        });
        
        if (balanceText && balanceText.includes('₹')) {
            break;
        }
        
        await page.waitForTimeout(1000);
        attempts++;
    }
    
    log(`[DEBUG] Raw balance text scraped: "${balanceText}" (after ${attempts}s)`);
    
    if (balanceText) {
      const cleaned = balanceText.replace(/[^0-9.]/g, '');
      const balance = parseFloat(cleaned);
      if (!isNaN(balance)) {
        log(`💰 Current Balance: ₹${balance.toFixed(2)}`);
        
        if (currentSessionId) {
           const session = await prisma.botSession.findUnique({ where: { id: currentSessionId } });
           if (session && session.initialBalance === null) {
              await prisma.botSession.update({ where: { id: currentSessionId }, data: { initialBalance: balance, finalBalance: balance } });
           } else if (session) {
              await prisma.botSession.update({ where: { id: currentSessionId }, data: { finalBalance: balance } });
           }
        }

        if (process.send) {
          process.send({ type: 'BALANCE_UPDATE', data: { balance } });
        }
        
        log(`[DEBUG] Check auto-deposit: balance=${balance}, minDepositBalance=${globalOptions.minDepositBalance}, isDepositing=${isDepositing}, depositFailed=${depositFailed}`);

        if (globalOptions.minDepositBalance && balance <= globalOptions.minDepositBalance && context) {
          if (depositFailed) {
            if (process.send) {
                process.send({ type: 'DEPOSIT_UPDATE', data: { status: 'FAILED', address: null, failed: true } });
            }
          } else if (!isDepositing) {
            handleDepositFlow(page, context, balance);
          }
        }
      }
    }
  } catch (err) {
    log(`⚠️ Could not scrape balance: ${err.message}`);
  }
}

function fetchPrediction() {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}/api/state?timer=${TIMER}`;
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

function getBetQuantity(level) {
  if (!currentStrategy) return 1;
  const s = currentStrategy;
  
  if (s.levels && s.levels.length > 0) {
    const idx = (level || 1) - 1;
    if (idx >= 0 && idx < s.levels.length) {
      return s.levels[idx];
    }
    return s.levels[s.levels.length - 1];
  }
  return 1 * Math.pow(2, (level || 1) - 1);
}

async function placeBet(page, selector, label, level, issue) {
  try {
    const quantity = getBetQuantity(level);
    log(`  Clicking ${label} button (Level ${level}, Qty ${quantity})...`);

    const btn = page.locator(selector).first();
    try {
      await btn.click({ timeout: 2000 });
    } catch (e) {
      log(`  ⚠️ Normal click intercepted, forcing via JS...`);
      await btn.evaluate(node => node.click());
    }
    await page.waitForTimeout(1500);

    const popup = page.locator('.lottery-container');
    await popup.waitFor({ state: 'visible', timeout: 3000 });
    log(`  Popup opened.`);

    if (quantity > 1) {
      await page.evaluate((qty) => {
        const input = document.querySelector('.multiplier-section input[type="number"]');
        if (input) {
          const nativeSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 'value'
          ).set;
          nativeSetter.call(input, qty);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, String(quantity));
      log(`  Set quantity to ${quantity}`);
      await page.waitForTimeout(500);
    }

    log(`  Confirming bet...`);
    const confirmBtn = popup.locator('button.bet-amount');
    await confirmBtn.waitFor({ state: 'visible', timeout: 3000 });
    await confirmBtn.click({ force: true });
    await page.waitForTimeout(1000);

    log(`  ✅ ${label} L${level} bet placed — ₹${quantity}.00`);
    if (issue) {
      pendingBets.push({ issue, betType: label, betQuantity: quantity, level });
    }
    return true;
  } catch (err) {
    log(`  ❌ Failed to place ${label} bet: ${err.message}`);
    return false;
  }
}

let isBetting = false;

async function onNewRound(page, context) {
  if (isBetting || isDepositing) {
    log("⚠️  Already active (betting/depositing), skipping duplicate WS trigger.");
    return;
  }
  
  const isActive = await checkActiveSchedule();
  if (!isActive) {
      await scrapeBalance(page, context);
      return;
  }

  if (isSessionPaused) {
    log(`🛑 Bot is paused because Max Wins (${currentStrategy?.maxWins}) or Max Losses (${currentStrategy?.maxLosses}) reached in this time slot.`);
    await scrapeBalance(page, context);
    return;
  }

  isBetting = true;

  try {
    log("🔔 New round detected! Fetching prediction...");
    const apiState = await fetchPrediction();
    const pending = apiState.pending;
    const engineState = apiState.state; 

    if (apiState.results && pendingBets.length > 0) {
      const resultsMap = {};
      for (const res of apiState.results) {
        resultsMap[res.issue] = res.num;
      }

      const remainingBets = [];
      for (const bet of pendingBets) {
        if (resultsMap[bet.issue] !== undefined) {
          const winningNum = resultsMap[bet.issue];
          let won = false;
          const b = bet.betType;
          
          if (b === 'BIG' && winningNum >= 5) won = true;
          else if (b === 'SMALL' && winningNum <= 4) won = true;
          else if (b === 'RED' && [2,4,6,8,0].includes(winningNum)) won = true;
          else if (b === 'GREEN' && [1,3,7,9,5].includes(winningNum)) won = true;
          else if (b === 'VIOLET' && [0,5].includes(winningNum)) won = true;

          let amount = 0;
          if (won) {
            sessionWins++;
            if ((b === 'RED' && winningNum === 0) || (b === 'GREEN' && winningNum === 5)) {
              amount = bet.betQuantity * 0.47;
            } else if (b === 'VIOLET') {
              amount = bet.betQuantity * 3.42;
            } else {
              amount = bet.betQuantity * 0.96;
            }
          } else {
            sessionLosses++;
            amount = -bet.betQuantity;
          }

          log(`🎯 Bet on ${b} for ${bet.issue} resolved: ${won ? 'WON' : 'LOST'} (Winning Num: ${winningNum}, Amount: ₹${amount.toFixed(2)})`);
          
          if (currentSessionId) {
             await prisma.botSession.update({
                where: { id: currentSessionId },
                data: { totalWins: sessionWins, totalLosses: sessionLosses }
             });
          }

          if (process.send) {
            process.send({
              type: 'ROUND_RESULT',
              data: {
                issue: bet.issue,
                betType: b,
                betQuantity: bet.betQuantity,
                won,
                amount
              }
            });
          }
        } else {
          remainingBets.push(bet);
        }
      }
      pendingBets = remainingBets;
      
      await page.waitForTimeout(2000);
      await scrapeBalance(page, context);
    }

    if (!pending) {
      log("⚠️  No pending prediction available. Skipping this round.");
      return;
    }

    if (currentStrategy) {
      if (currentStrategy.maxWins && sessionWins >= currentStrategy.maxWins) {
        log(`🛑 Reached max wins limit (${currentStrategy.maxWins}). Pausing bot.`);
        isSessionPaused = true;
        if (currentSessionId) await prisma.botSession.update({ where: { id: currentSessionId }, data: { status: 'TAKE_PROFIT' } });
        return;
      }
      if (currentStrategy.maxLosses && sessionLosses >= currentStrategy.maxLosses) {
        log(`🛑 Reached max losses limit (${currentStrategy.maxLosses}). Pausing bot.`);
        isSessionPaused = true;
        if (currentSessionId) await prisma.botSession.update({ where: { id: currentSessionId }, data: { status: 'STOP_LOSS' } });
        return;
      }
    }

    const bsLevel = engineState?.bsLevel || 1;
    const rgLevel = engineState?.rgLevel || 1;

    log(`📊 Prediction for issue ${pending.issue}:`);
    log(`   BS: ${pending.bsPred || "NO SIGNAL"} (Quality: ${pending.bsQuality}, Level: L${bsLevel}, Layer: ${pending.bsLayer})`);
    log(`   RG: ${pending.rgPred || "NO SIGNAL"} (Quality: ${pending.rgQuality}, Level: L${rgLevel}, Layer: ${pending.rgLayer})`);

    const s = currentStrategy;
    if (!s) {
       log("⚠️ No strategy loaded. Skipping bet.");
       return;
    }
    const config = s.config || {};
    const ALLOWED_QUALITIES = config.ALLOWED_QUALITIES || ["A", "B"];

    const betBigSmall = globalOptions.playBigSmall !== undefined ? globalOptions.playBigSmall : config.BET_BIG_SMALL;
    const betRedGreen = globalOptions.playRedGreen !== undefined ? globalOptions.playRedGreen : config.BET_RED_GREEN;

    if (betBigSmall && pending.bsPred) {
      if (bsLevel > (s.maxLevel || 12)) {
        log(`   🛑 Skipping BS bet — Level ${bsLevel} exceeds MAX_LEVEL ${s.maxLevel || 12}`);
      } else if (bsLevel < (s.minLevel || 1)) {
        log(`   🛑 Skipping BS bet — Level ${bsLevel} is below MIN_LEVEL ${s.minLevel || 1}`);
      } else if (ALLOWED_QUALITIES.includes(pending.bsQuality)) {
        const selector = pending.bsPred === "BIG" ? ".Betting__C-foot-b" : ".Betting__C-foot-s";
        await placeBet(page, selector, pending.bsPred, bsLevel, pending.issue);
      } else {
        log(`   ⏭️  Skipping BS bet — quality "${pending.bsQuality}" not in [${ALLOWED_QUALITIES}]`);
      }
    }

    if (betRedGreen && pending.rgPred) {
      if (rgLevel > (s.maxLevel || 12)) {
        log(`   🛑 Skipping RG bet — Level ${rgLevel} exceeds MAX_LEVEL ${s.maxLevel || 12}`);
      } else if (rgLevel < (s.minLevel || 1)) {
        log(`   🛑 Skipping RG bet — Level ${rgLevel} is below MIN_LEVEL ${s.minLevel || 1}`);
      } else if (ALLOWED_QUALITIES.includes(pending.rgQuality)) {
        let selector;
        switch (pending.rgPred) {
          case "RED":    selector = ".Betting__C-head-red"; break;
          case "GREEN":  selector = ".Betting__C-head-green"; break;
          case "VIOLET": selector = ".Betting__C-head-violet"; break;
          default:
            log(`   ⚠️  Unknown RG prediction: ${pending.rgPred}`);
            return;
        }
        await placeBet(page, selector, pending.rgPred, rgLevel, pending.issue);
      } else {
        log(`   ⏭️  Skipping RG bet — quality "${pending.rgQuality}" not in [${ALLOWED_QUALITIES}]`);
      }
    }
  } catch (err) {
    log(`❌ Error in onNewRound: ${err.message}`);
  } finally {
    isBetting = false;
    await page.waitForTimeout(1000);
    await scrapeBalance(page, context);
  }
}

function connectWebSocket(page, context) {
  log("🔌 Connecting to prediction WebSocket...");
  const ws = new WebSocket(WS_URL);

  ws.on("open", () => {
    log("🟢 WebSocket connected to prediction engine!");
  });

  ws.on("message", async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === "new_result") {
        log(`📨 WS: new_result for issue ${msg.issue}`);
        await page.waitForTimeout(2000);
        await onNewRound(page, context);
      }
    } catch (err) {
      log(`⚠️  WS message parse error: ${err.message}`);
    }
  });

  ws.on("close", () => {
    log("🔴 WebSocket disconnected. Reconnecting in 5s...");
    setTimeout(() => connectWebSocket(page, context), 5000);
  });

  ws.on("error", (err) => {
    log(`⚠️  WebSocket error: ${err.message}`);
  });

  return ws;
}

(async () => {
  log("Starting Wingo bot...");
  const accountId = (CREDENTIALS.PHONE || 'default').replace(/[^a-zA-Z0-9]/g, '_');
  const userDataDir = `./backend-user-data-${accountId}`;
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--headless=new"],
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  const closePopups = async () => {
    try {
      const confirmBtn = page.locator(".announcement-dialog__button").first();
      if (await confirmBtn.isVisible({ timeout: 2000 })) {
        await confirmBtn.click();
        log("Closed announcement popup.");
        await page.waitForTimeout(1000);
      }
    } catch (err) {}
    try {
      const dismissBtn = page.locator('text="Don\'t log in yet, continue browsing"').first();
      if (await dismissBtn.isVisible({ timeout: 1000 })) {
        await dismissBtn.click();
        log("Dismissed Event Rewards popup.");
        await page.waitForTimeout(1000);
      }
    } catch (err) {}
    try {
      const firstRechargeClose = page.locator(".first-recharge-queue-dialog__close").first();
      if (await firstRechargeClose.isVisible({ timeout: 1000 })) {
        await firstRechargeClose.click();
        log("Closed First Deposit Bonus popup.");
        await page.waitForTimeout(1000);
      }
    } catch (err) {}
  };

  log("Navigating to home page to check session...");
  await page.goto("https://bdg2030.com", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);

  // Check if we are logged out by looking for the login form container
  const loginForm = page.locator('.login__container-form').first();
  let needsLogin = false;
  try {
      needsLogin = await loginForm.isVisible({ timeout: 5000 });
  } catch (err) {
      // If .login__container-form is not found, fallback to checking inputs
      const anyInput = page.locator('input[name="userNumber"], input[name="userEmail"]').first();
      needsLogin = await anyInput.isVisible().catch(() => false);
  }

  if (needsLogin) {
    log("Session not found. Proceeding with login...");
    const accountStr = CREDENTIALS.PHONE || '';
    const isEmail = accountStr.includes('@');

    if (isEmail) {
        log("Email login detected. Switching to Email tab...");
        const emailInput = page.locator('input[name="userEmail"]').first();
        let isVisible = await emailInput.isVisible().catch(() => false);
        
        if (!isVisible) {
            // Try to click the Email tab
            const potentialTabs = page.locator('.login_container-tab .tab').filter({ hasText: /Email/i });
            const count = await potentialTabs.count();
            for (let i = 0; i < count; i++) {
                try {
                    const el = potentialTabs.nth(i);
                    if (await el.isVisible()) {
                        await el.click({ timeout: 1000 });
                        await page.waitForTimeout(500);
                        if (await emailInput.isVisible()) {
                            isVisible = true;
                            break;
                        }
                    }
                } catch (e) {}
            }
        }
        
        if (isVisible) {
            log("Filling in email address...");
            await emailInput.fill(accountStr);
        } else {
            log("❌ Failed to switch to Email login tab.");
            // Fallback just in case
            await emailInput.fill(accountStr).catch(() => {});
        }
    } else {
        log("Phone login detected.");
        const phoneInput = page.locator('input[name="userNumber"]').first();
        let isVisible = await phoneInput.isVisible().catch(() => false);
        
        if (!isVisible) {
             // If we are on Email tab, switch back to Phone tab
            const potentialTabs = page.locator('.login_container-tab .tab').filter({ hasText: /Phone/i });
            const count = await potentialTabs.count();
            for (let i = 0; i < count; i++) {
                try {
                    const el = potentialTabs.nth(i);
                    if (await el.isVisible()) {
                        await el.click({ timeout: 1000 });
                        await page.waitForTimeout(500);
                        if (await phoneInput.isVisible()) {
                            break;
                        }
                    }
                } catch (e) {}
            }
        }
        
        log("Filling in phone number...");
        await phoneInput.fill(accountStr).catch(() => {});
    }
    
    log("Filling in password...");
    // Find the visible password input (since there is one for each tab)
    const pwdInput = page.locator('input[type="password"]:visible').first();
    await pwdInput.fill(CREDENTIALS.PASSWORD || '').catch(() => {});
    
    log("Submitting login...");
    try {
      // Find the visible login button
      const loginBtn = page.locator('button:visible').filter({ hasText: /log\s*in/i }).first();
      await loginBtn.click({ timeout: 2000 });
    } catch (err) {
      await page.keyboard.press('Enter');
    }
    
    log("Waiting for login response...");
    await page.waitForTimeout(5000);
  } else {
    log("✅ Already logged in (session restored)!");
  }

  await closePopups();
  await page.waitForTimeout(1000);
  await closePopups();

  // Dismiss "Add to Desktop" banner if present
  try {
    const addToDesktop = page.locator('text="Add to Desktop"').first();
    if (await addToDesktop.isVisible({ timeout: 1000 })) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      log("Dismissed 'Add to Desktop' overlay.");
    }
  } catch (err) {}

  // Step 1: Try clicking Win Go 30s card directly (old layout)
  log("Clicking on 'Win Go 30s' card...");
  let navigatedToGame = false;
  
  try {
    const winGoCard = page.locator(".lotterySlotItem").filter({ hasText: "Win Go 30s" }).first();
    if (await winGoCard.isVisible({ timeout: 2000 })) {
      await winGoCard.click({ timeout: 3000 });
      log("Clicked 'Win Go 30s' directly.");
      await page.waitForTimeout(3000);
      await closePopups();
      navigatedToGame = await page.evaluate(() => !!document.querySelector('.TimeLeft__C, .Wallet__C-balance-l1, .GameRecord__C'));
    }
  } catch (err) {}

  // Step 2: If not found, try clicking the Lottery category first (new layout)
  if (!navigatedToGame) {
    log("⚠️ Direct Win Go card not found. Trying Lottery category first...");
    try {
      const lotteryCard = page.locator('text="Lottery"').first();
      if (await lotteryCard.isVisible({ timeout: 2000 })) {
        await lotteryCard.click({ timeout: 3000 });
        log("Clicked 'Lottery' category.");
        await page.waitForTimeout(2000);
        await closePopups();
        
        // Now look for Win Go 30s
        const winGoCard = page.locator(".lotterySlotItem").filter({ hasText: "Win Go 30s" }).first();
        if (await winGoCard.isVisible({ timeout: 3000 })) {
          await winGoCard.click({ timeout: 3000 });
          log("Clicked 'Win Go 30s' from Lottery page.");
          await page.waitForTimeout(3000);
          await closePopups();
          navigatedToGame = await page.evaluate(() => !!document.querySelector('.TimeLeft__C, .Wallet__C-balance-l1, .GameRecord__C'));
        }
      }
    } catch (err) {
      log("Lottery category click failed: " + err.message);
    }
  }
  
  // Step 3: If still not on game page, try the "Win Go" tab in the nav
  if (!navigatedToGame) {
    log("⚠️ Still not on game page. Trying 'Win Go' tab...");
    try {
      const winGoTab = page.locator('text="Win Go"').first();
      if (await winGoTab.isVisible({ timeout: 2000 })) {
        await winGoTab.click({ timeout: 3000 });
        log("Clicked 'Win Go' tab.");
        await page.waitForTimeout(2000);
        await closePopups();
        
        const winGoCard = page.locator(".lotterySlotItem").filter({ hasText: "Win Go 30s" }).first();
        if (await winGoCard.isVisible({ timeout: 3000 })) {
          await winGoCard.click({ timeout: 3000 });
          log("Clicked 'Win Go 30s' from Win Go tab.");
          await page.waitForTimeout(3000);
          await closePopups();
          navigatedToGame = await page.evaluate(() => !!document.querySelector('.TimeLeft__C, .Wallet__C-balance-l1, .GameRecord__C'));
        }
      }
    } catch (err) {}
  }

  // Step 4: Last resort - try navigating via Activity tab
  if (!navigatedToGame) {
    log("⚠️ All clicks failed. Trying Activity tab...");
    try {
      const activityTab = page.locator('text="Activity"').first();
      await activityTab.click({ timeout: 3000 });
      await page.waitForTimeout(2000);
      // Go back to home and try again
      await page.goto("https://bdg2030.com/#/lottery", { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(3000);
      await closePopups();
      
      const winGoCard = page.locator(".lotterySlotItem").filter({ hasText: "Win Go 30s" }).first();
      if (await winGoCard.isVisible({ timeout: 5000 })) {
        await winGoCard.click({ timeout: 3000 });
        log("Clicked 'Win Go 30s' after navigating to lottery page.");
        await page.waitForTimeout(3000);
        await closePopups();
        navigatedToGame = true;
      }
    } catch (err) {
      log("Activity fallback also failed: " + err.message);
    }
  }

  // Take a screenshot of whatever page we ended up on
  await page.screenshot({ path: "ready-to-bet.png" });
  
  // Log the current page state for debugging
  const debugInfo = await page.evaluate(() => {
    const url = window.location.href;
    const classes = Array.from(document.querySelectorAll('[class]')).map(e => e.className).filter(c => typeof c === 'string' && (c.includes('Wallet') || c.includes('balance') || c.includes('TimeLeft') || c.includes('GameRecord'))).slice(0, 10);
    return { url, classes };
  });
  log(`[DEBUG] Current state - URL: ${debugInfo.url}, Relevant classes: ${JSON.stringify(debugInfo.classes)}`);
  
  log("✅ Bot is ready on the Win Go 30s page!");

  await scrapeBalance(page, context);

  connectWebSocket(page, context);

  await new Promise(() => {});
})();
