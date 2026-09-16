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

async function scrapeBalance(page) {
  try {
    const balanceText = await page.evaluate(() => {
      const el = document.querySelector('.Wallet__C-balance-l1 > div');
      return el ? el.innerText.replace(/[^0-9.]/g, '') : null;
    });
    if (balanceText) {
      const balance = parseFloat(balanceText);
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

async function onNewRound(page) {
  if (isBetting) {
    log("⚠️  Already placing a bet, skipping duplicate WS trigger.");
    return;
  }
  
  const isActive = await checkActiveSchedule();
  if (!isActive) return;

  if (isSessionPaused) {
    log(`🛑 Bot is paused because Max Wins (${currentStrategy?.maxWins}) or Max Losses (${currentStrategy?.maxLosses}) reached in this time slot.`);
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
      await scrapeBalance(page);
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
    await scrapeBalance(page);
  }
}

function connectWebSocket(page) {
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
        await onNewRound(page);
      }
    } catch (err) {
      log(`⚠️  WS message parse error: ${err.message}`);
    }
  });

  ws.on("close", () => {
    log("🔴 WebSocket disconnected. Reconnecting in 5s...");
    setTimeout(() => connectWebSocket(page), 5000);
  });

  ws.on("error", (err) => {
    log(`⚠️  WebSocket error: ${err.message}`);
  });

  return ws;
}

(async () => {
  log("Starting Wingo bot...");
  const userDataDir = "./backend-user-data";
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

  log("Navigating to login page...");
  try {
    await page.goto("https://bdg2030.com/#/login", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
  } catch (error) {
    log("Navigation timeout, continuing...");
  }
  await page.waitForTimeout(4000);

  log("Filling in phone number...");
  await page.fill('input[name="userNumber"]', CREDENTIALS.PHONE);

  log("Filling in password...");
  await page.fill('input[placeholder="Password"]', CREDENTIALS.PASSWORD);

  log("Submitting login...");
  try {
    const loginBtn = page.locator('text=/log\\s*in/i, text=/sign\\s*in/i, button:visible').first();
    await loginBtn.click({ timeout: 2000 });
  } catch (err) {
    await page.press('input[placeholder="Password"]', "Enter");
  }

  log("Waiting for login response...");
  await page.waitForTimeout(5000);

  await closePopups();
  await page.waitForTimeout(1000);
  await closePopups();

  log("Clicking on 'Win Go 30s' card...");
  try {
    const winGoCard = page.locator(".lotterySlotItem").filter({ hasText: "Win Go 30s" }).first();
    await winGoCard.click({ timeout: 5000 });
    log("Clicked 'Win Go 30s'.");
  } catch (err) {
    log("Could not find 'Win Go 30s' card: " + err.message);
  }

  await page.waitForTimeout(3000);
  await closePopups();

  await page.screenshot({ path: "ready-to-bet.png" });
  log("✅ Bot is ready on the Win Go 30s page!");

  await scrapeBalance(page);

  connectWebSocket(page);

  await new Promise(() => {});
})();
