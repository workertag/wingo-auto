const { chromium } = require("playwright-extra");
const stealth = require("puppeteer-extra-plugin-stealth")();
const { decrypt } = require("./crypto");

chromium.use(stealth);

class PlaywrightBot {
  constructor(botInstance, redisSubscriber, redisPublisher, prisma) {
    this.botId = botInstance.id;
    this.userId = botInstance.userId;
    this.phone = botInstance.wingoPhone;
    this.password = decrypt(botInstance.wingoPasswordAuth);
    this.endpoint = botInstance.endpoint;
    this.strategy = null; // Will be loaded dynamically if needed
    this.settings = botInstance.settings || {};
    
    this.sub = redisSubscriber;
    this.pub = redisPublisher;
    this.prisma = prisma;
    
    this.browser = null;
    this.context = null;
    this.page = null;
    
    this.playwrightContext = null;
    this.predictionListener = null;

    this.isDepositing = false;
    this.depositFailed = false;
    this.cancelDepositFlag = false;

    this.isRunning = false;
    this.pendingBets = [];
    this.sessionWins = 0;
    this.sessionLosses = 0;
    
    // Bind the listener so we can remove it later
    this.onMessageListener = async (channel, message) => {
      if (channel === 'wingo:predictions' && this.isRunning) {
        const predictionData = JSON.parse(message);
        await this.onPrediction(predictionData);
      }
    };
  }

  log(msg) {
    const ts = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" }) + " IST";
    console.log(`[Bot:${this.botId}] [${ts}] ${msg}`);
    const payload = { botId: this.botId, type: 'LOG', msg, ts };
    this.pub.publish('bot-events', JSON.stringify(payload));
    this.pub.lpush(`wingo:logs:${this.botId}`, JSON.stringify(payload));
    this.pub.ltrim(`wingo:logs:${this.botId}`, 0, 99);
  }

  publishEvent(type, data) {
    const payload = { botId: this.botId, type, data, ts: Date.now() };
    this.pub.publish('bot-events', JSON.stringify(payload));
    if (['BOT_STARTED', 'BOT_STOPPED', 'BOT_ERROR', 'BALANCE_UPDATE', 'BET_RESOLVED'].includes(type)) {
      this.pub.lpush(`wingo:logs:${this.botId}`, JSON.stringify(payload));
      this.pub.ltrim(`wingo:logs:${this.botId}`, 0, 99);
    }
  }

  async start() {
    this.isRunning = true;
    try {
      // Clear previous session logs and bets
      await this.pub.del(`bot:${this.botId}:logs`).catch(() => {});
      await this.prisma.betRecord.deleteMany({ where: { botInstanceId: this.botId } }).catch(() => {});
      await this.prisma.botInstance.update({ 
        where: { id: this.botId }, 
        data: { sessionWins: 0, sessionLosses: 0 } 
      }).catch(() => {});
      
      this.log("Starting browser...");
      let launchOptions = {
        headless: process.env.HEADLESS !== 'false',
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disk-cache-size=1", "--disable-dev-shm-usage"],
      };

      let contextOptions = {
        viewport: { width: 375, height: 812 },
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
      };
      
      if (this.endpoint && this.endpoint.isActive) {
        let proxyServer = `http://${this.endpoint.host}:${this.endpoint.port}`;
        contextOptions.proxy = {
          server: proxyServer,
          username: this.endpoint.proxyUser || undefined,
          password: this.endpoint.proxyPass || undefined
        };
        this.log(`Using proxy: ${proxyServer}`);
      } else {
        this.log("No proxy configured. Using direct connection.");
      }

      this.browser = await chromium.launch(launchOptions);
      this.context = await this.browser.newContext(contextOptions);
      this.page = await this.context.newPage();
      this.playwrightContext = this.context;

      await this.login();

      // Listen for predictions
      this.sub.subscribe('wingo:predictions', (err) => {
        if (err) this.log(`Failed to subscribe to predictions: ${err.message}`);
        else this.log("Subscribed to prediction events.");
      });

      this.sub.on('message', this.onMessageListener);
      
      this.publishEvent('BOT_STARTED', { status: 'RUNNING' });
      this.settings = this.settings || {};
      this.settings.startedAt = Date.now();
      await this.prisma.botInstance.update({ 
        where: { id: this.botId }, 
        data: { 
          status: 'RUNNING',
          settings: this.settings 
        } 
      });

    } catch (err) {
      this.log(`Error starting bot: ${err.message}`);
      this.publishEvent('BOT_ERROR', { error: err.message });
      await this.stop();
    }
  }

  async stop() {
    this.isRunning = false;
    this.log("Stopping bot...");
    try {
      this.sub.removeListener('message', this.onMessageListener);
      if (this.browser) await this.browser.close();
      await this.prisma.botInstance.update({ where: { id: this.botId }, data: { status: 'STOPPED' } });
      this.publishEvent('BOT_STOPPED', { status: 'STOPPED' });
    } catch (e) {
      this.log(`Error while stopping: ${e.message}`);
    }
  }

  async login() {
    this.log("Navigating to login page...");
    await this.page.goto("https://bdg2030.com/#/login", { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
    await this.page.waitForTimeout(4000);

    const isEmail = this.phone.includes('@');
    if (isEmail) {
      this.log("Email login detected...");
      const potentialTabs = this.page.locator('.login_container-tab .tab').filter({ hasText: /Email/i });
      if (await potentialTabs.count() > 0) await potentialTabs.first().click({ timeout: 1000 }).catch(()=>{});
      await this.page.fill('input[name="userEmail"]', this.phone).catch(()=>{});
    } else {
      this.log("Phone login detected...");
      await this.page.fill('input[name="userNumber"]', this.phone).catch(()=>{});
    }
    
    await this.page.fill('input[type="password"]:visible', this.password).catch(()=>{});
    
    try {
      const loginBtn = this.page.locator('button:visible').filter({ hasText: /log\s*in/i }).first();
      await loginBtn.click({ timeout: 2000 });
    } catch (err) {
      await this.page.keyboard.press('Enter');
    }
    
    this.log("Waiting for login response...");
    await this.page.waitForTimeout(5000);
    
    await this.closePopups();

    // Attempt navigation to game
    try {
      await this.page.goto("https://bdg2030.com/#/home", { waitUntil: "domcontentloaded" }).catch(() => {});
      await this.page.waitForTimeout(2000);
      await this.closePopups();

      let navigatedToGame = false;
      const winGoCard = this.page.locator(".lotterySlotItem").filter({ hasText: "Win Go 30s" }).first();
      
      if (await winGoCard.isVisible({ timeout: 3000 })) {
        await winGoCard.evaluate(el => el.click());
        this.log("Clicked 'Win Go 30s' directly.");
        await this.page.waitForTimeout(3000);
        await this.closePopups();
        navigatedToGame = await this.page.evaluate(() => !!document.querySelector('.TimeLeft__C, .Wallet__C-balance-l1, .GameRecord__C'));
      }
      
      if (!navigatedToGame) {
        this.log("⚠️ Direct Win Go card not found or click failed. Trying Lottery category first...");
        try {
          const lotteryCard = this.page.locator('text="Lottery"').first();
          if (await lotteryCard.isVisible({ timeout: 2000 })) {
            await lotteryCard.evaluate(el => el.click());
            this.log("Clicked 'Lottery' category.");
            await this.page.waitForTimeout(2000);
            await this.closePopups();
            
            const winGoCard2 = this.page.locator(".lotterySlotItem").filter({ hasText: "Win Go 30s" }).first();
            if (await winGoCard2.isVisible({ timeout: 3000 })) {
              await winGoCard2.evaluate(el => el.click());
              this.log("Clicked 'Win Go 30s' from Lottery page.");
              await this.page.waitForTimeout(3000);
              await this.closePopups();
              navigatedToGame = await this.page.evaluate(() => !!document.querySelector('.TimeLeft__C, .Wallet__C-balance-l1, .GameRecord__C'));
            }
          }
        } catch (err) { }
      }

      if (navigatedToGame) {
        this.log("Successfully entered Win Go 30s.");
        await this.page.waitForTimeout(2000);
        await this.scrapeBalance();
      } else {
         this.log("Could not navigate to Win Go 30s.");
      }
    } catch (e) {
       this.log("Error navigating to game: " + e.message);
    }
  }

  async closePopups() {
    try {
      const confirmBtn = this.page.locator(".announcement-dialog__button").first();
      if (await confirmBtn.isVisible({ timeout: 1000 })) {
        await confirmBtn.click();
        this.log("Closed announcement popup.");
        await this.page.waitForTimeout(1000);
      }
    } catch (err) {}
    try {
      const dismissBtn = this.page.locator('text="Don\'t log in yet, continue browsing"').first();
      if (await dismissBtn.isVisible({ timeout: 1000 })) {
        await dismissBtn.click();
        this.log("Dismissed Event Rewards popup.");
        await this.page.waitForTimeout(1000);
      }
    } catch (err) {}
    try {
      const firstRechargeClose = this.page.locator(".first-recharge-queue-dialog__close").first();
      if (await firstRechargeClose.isVisible({ timeout: 1000 })) {
        await firstRechargeClose.click();
        this.log("Closed First Deposit Bonus popup.");
        await this.page.waitForTimeout(1000);
      }
    } catch (err) {}
  }

  async scrapeBalance() {
    try {
      let balanceText = null;
      let attempts = 0;
      
      while (attempts < 20) {
          balanceText = await this.page.evaluate(() => {
              const el = document.querySelector('.Wallet__C-balance-l1');
              return el ? el.innerText : null;
          });
          
          if (balanceText && balanceText.includes('₹')) {
              break;
          }
          await this.page.waitForTimeout(1000);
          attempts++;
      }
      
      if (balanceText) {
        const cleaned = balanceText.replace(/[^0-9.]/g, '');
        const balance = parseFloat(cleaned);
        if (!isNaN(balance)) {
          this.currentBalance = balance;
          this.log(`💰 Current Balance: ₹${balance.toFixed(2)}`);
          this.publishEvent('BALANCE_UPDATE', { balance });
          
          if (!this.isDepositing && this.settings?.autoDeposit?.enabled) {
             const minBal = this.settings.autoDeposit.minBalance || 0;
             if (balance <= minBal && !this.depositFailed) {
                 // Trigger auto deposit flow
                 this.handleDepositFlow(balance).catch(e => {
                     this.log(`Deposit flow error: ${e.message}`);
                 });
             }
          }

          this.prisma.botInstance.update({
            where: { id: this.botId },
            data: { currentBalance: parseFloat(balance) }
          }).catch(() => {});
        }
      }
    } catch (err) {
      this.log(`⚠️ Could not scrape balance: ${err.message}`);
    }
  }

  async getActiveStrategy() {
    if (!this.settings || !this.settings.schedules || this.settings.schedules.length === 0) {
      return null;
    }
    
    // Fetch to ensure we have the latest
    const timeSlots = await this.prisma.timeSlot.findMany();
    const strategies = await this.prisma.strategy.findMany();
    
    const now = new Date();
    const options = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false };
    const currentHHMM = new Intl.DateTimeFormat('en-GB', options).format(now);
    
    for (const schedule of this.settings.schedules) {
      const ts = timeSlots.find(t => t.id === schedule.timeSlotId);
      if (ts && currentHHMM >= ts.startTime && currentHHMM <= ts.endTime) {
        return strategies.find(s => s.id === schedule.strategyId);
      }
    }
    return null;
  }

  getBetQuantity(level, strategy) {
    if (strategy && strategy.levels && strategy.levels.length >= level) {
       const amt = strategy.levels[level - 1];
       if (amt !== undefined && amt !== null && amt > 0) return amt;
    }
    return 1 * Math.pow(2, (level || 1) - 1);
  }

  async placeBet(selector, label, level, issue, strategy = null) {
    try {
      const quantity = this.getBetQuantity(level, strategy);
      this.log(`  Clicking ${label} button (Level ${level}, Qty ${quantity})...`);

      const btn = this.page.locator(selector).first();
      await btn.evaluate(node => node.click());
      await this.page.waitForTimeout(300); // Wait for popup animation
      this.log(`  Popup opened.`);

      if (quantity > 1) {
        await this.page.evaluate((qty) => {
          const inputs = Array.from(document.querySelectorAll('.multiplier-section input[type="number"]'));
          const visibleInput = inputs.find(b => b.offsetWidth > 0 || b.offsetHeight > 0 || b.getClientRects().length > 0);
          if (visibleInput) {
            const nativeSetter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype, 'value'
            ).set;
            nativeSetter.call(visibleInput, qty);
            visibleInput.dispatchEvent(new Event('input', { bubbles: true }));
            visibleInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, String(quantity));
        this.log(`  Set quantity to ${quantity}`);
        await this.page.waitForTimeout(500);
      }

      this.log(`  Confirming bet...`);
      await this.page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('.lottery-container button.bet-amount'));
        const visibleBtn = btns.find(b => b.offsetWidth > 0 || b.offsetHeight > 0 || b.getClientRects().length > 0);
        if (visibleBtn) visibleBtn.click();
      });
      
      await this.page.waitForTimeout(400);

      this.log(`  ✅ ${label} L${level} bet placed — ₹${quantity}.00`);
      
      if (this.currentBalance !== null && this.currentBalance !== undefined) {
        this.currentBalance -= quantity;
        this.publishEvent('BALANCE_UPDATE', { balance: parseFloat(this.currentBalance.toFixed(2)) });
        
        this.prisma.botInstance.update({
          where: { id: this.botId },
          data: { currentBalance: parseFloat(this.currentBalance.toFixed(2)) }
        }).catch(() => {});
      }

      if (issue) {
        this.pendingBets.push({ issue, betType: label, betQuantity: quantity, level });
        
        // Save to DB asynchronously
        this.prisma.betRecord.create({
          data: {
            botInstanceId: this.botId,
            issue: issue,
            betType: label,
            amount: Number(quantity)
          }
        }).catch(err => console.error('Failed to save BetRecord:', err));
      }
      return true;
    } catch (err) {
      this.log(`  ❌ Failed to place ${label} bet: ${err.message}`);
      return false;
    }
  }

  async onPrediction(predictionData) {
    if (!this.isRunning) return;
    
    try {
      const { pending, state, results, issue } = predictionData;
      const currentIssue = pending?.issue || issue;
      if (!currentIssue) return;

      this.log(`📊 Prediction for issue ${currentIssue}:`);
      
      const bsLevel = state?.bsLevel || 1;
      const rgLevel = state?.rgLevel || 1;
      
      if (pending) {
        this.log(`   BS: ${pending.bsPred || "NO SIGNAL"} (Quality: ${pending.bsQuality}, Level: L${bsLevel})`);
        this.log(`   RG: ${pending.rgPred || "NO SIGNAL"} (Quality: ${pending.rgQuality}, Level: L${rgLevel})`);
      }
      
      // 1. Resolve past bets if results exist
      if (results && this.pendingBets.length > 0) {
          const resultsMap = {};
          results.forEach(r => { resultsMap[r.issue] = r.num; }); // API returns num, not number
          
          const remainingBets = [];
          for (const bet of this.pendingBets) {
            if (resultsMap[bet.issue] !== undefined) {
              const winningNum = resultsMap[bet.issue];
              const isSmall = winningNum >= 0 && winningNum <= 4;
              const isBig = winningNum >= 5 && winningNum <= 9;
              const isRed = [2,4,6,8,0].includes(winningNum); // 0 is RedViolet
              const isGreen = [1,3,5,7,9].includes(winningNum); // 5 is GreenViolet
              const b = bet.betType;
              
              let won = false;
              let amount = 0;
              if (b === "BIG" && isBig) won = true;
              else if (b === "SMALL" && isSmall) won = true;
              else if (b === "RED" && isRed) won = true;
              else if (b === "GREEN" && isGreen) won = true;
              
              let profit = 0;
              if (won) {
                if (b === "RED" || b === "GREEN") {
                  if (winningNum === 0 || winningNum === 5) {
                    amount = bet.betQuantity * 1.47;
                  } else {
                    amount = bet.betQuantity * 1.96;
                  }
                } else {
                  amount = bet.betQuantity * 1.96;
                }
                profit = amount - bet.betQuantity;
              } else {
                amount = -bet.betQuantity;
                profit = -bet.betQuantity;
              }
              
              this.log(`🎯 Bet on ${b} for ${bet.issue} resolved: ${won ? 'WON' : 'LOST'} (Winning Num: ${winningNum}, Net Profit: ₹${profit.toFixed(2)})`);
              
              this.publishEvent('BET_RESOLVED', { won, amount: profit, issue: bet.issue, betType: b });

              // Sync frontend balance via DB increment approximation
              // since real balance scraping is expensive and async
              this.currentBalance = (this.currentBalance || 0) + profit;
              this.publishEvent('BALANCE_UPDATE', { balance: parseFloat(this.currentBalance.toFixed(2)) });

              // Update DB asynchronously
              this.prisma.betRecord.updateMany({
                where: { botInstanceId: this.botId, issue: bet.issue, betType: b },
                data: { status: won ? 'WON' : 'LOST', profit }
              }).catch(() => {});

              this.prisma.botInstance.update({
                where: { id: this.botId },
                data: {
                  sessionWins: { increment: won ? 1 : 0 },
                  sessionLosses: { increment: won ? 0 : 1 },
                  currentBalance: { increment: profit } // approximate, will be synced by real balance check
                }
              }).catch(() => {});
            } else {
              remainingBets.push(bet);
            }
          }
          this.pendingBets = remainingBets;
      }

      if (!currentIssue || !pending) return;
      if (this.isDepositing) return;

      // 2. Add randomized jitter between 500ms and 2500ms to avoid exact sync with other bots
      const delay = Math.floor(Math.random() * 2000) + 500;
      this.log(`Waiting ${delay}ms before placing bet...`);
      await this.page.waitForTimeout(delay);
      
      // 3. Place bet based on Strategy
      const activeStrategy = await this.getActiveStrategy();
      if (!activeStrategy) {
         this.log(`⚠️ No active strategy schedule for current time. Skipping bet.`);
         return;
      }

      const games = this.settings.games || [];
      const betBS = games.includes('B/S');
      const betRG = games.includes('R/G');
      
      if (pending.bsPred && betBS) {
        if (bsLevel >= activeStrategy.minLevel && bsLevel <= activeStrategy.maxLevel) {
           const selector = pending.bsPred === "BIG" ? ".Betting__C-foot-b" : ".Betting__C-foot-s";
           await this.placeBet(selector, pending.bsPred, bsLevel, currentIssue, activeStrategy);
        } else {
           this.log(`   🛑 Skipping BS bet — Level ${bsLevel} is outside Strategy limits [L${activeStrategy.minLevel} - L${activeStrategy.maxLevel}]`);
        }
      }
      
      if (pending.rgPred && betRG) {
        if (rgLevel >= activeStrategy.minLevel && rgLevel <= activeStrategy.maxLevel) {
           let selector;
           switch (pending.rgPred) {
             case "RED":    selector = ".Betting__C-head-red"; break;
             case "GREEN":  selector = ".Betting__C-head-green"; break;
             case "VIOLET": selector = ".Betting__C-head-violet"; break;
           }
           if (selector) {
              await this.placeBet(selector, pending.rgPred, rgLevel, currentIssue, activeStrategy);
           }
        } else {
           this.log(`   🛑 Skipping RG bet — Level ${rgLevel} is outside Strategy limits [L${activeStrategy.minLevel} - L${activeStrategy.maxLevel}]`);
        }
      }
      
    } catch (e) {
      if (this.isDepositing) {
        return;
      }
      if (this.isRunning) {
        this.log(`Error during prediction handling: ${e.message}`);
      }
    } finally {
      if (this.isRunning) {
        await this.page.waitForTimeout(1000);
        await this.scrapeBalance();
      }
    }
  }

  async handleDepositFlow(currentBalance) {
    if (this.isDepositing || this.depositFailed) return;
    this.isDepositing = true;
    this.log(`💸 Low balance (₹${currentBalance}) detected. Initiating automated deposit flow...`);
    
    this.publishEvent('DEPOSIT_UPDATE', { status: 'NAVIGATING', address: null, failed: false });

    try {
        this.log("   Clicking back to home screen...");
        await this.page.locator('.navbar__content-left .van-icon-arrow-left').first().evaluate(el => el.click());
        await this.page.waitForTimeout(2000);

        this.log("   Clicking Accounts tab...");
        await this.page.locator('.tabbar__container-item:has-text("Account")').first().evaluate(el => el.click());
        await this.page.waitForTimeout(2000);

        this.log("   Clicking Deposit button...");
        await this.page.locator('.totalSavings__container-content-item:has-text("Deposit")').first().evaluate(el => el.click());
        await this.page.waitForTimeout(2000);

        this.log("   Selecting USDT option...");
        await this.page.locator('.Recharge__container-tabcard__bot:has-text("USDT")').first().evaluate(el => el.click());
        await this.page.waitForTimeout(1000);

        const amount = this.settings.autoDeposit?.depositAmount || 10;
        this.log(`   Entering USDT amount: ${amount}`);
        await this.page.locator('.amount-input input').first().fill(String(amount), { force: true });
        await this.page.waitForTimeout(1000);

        this.log("   Submitting deposit and waiting for new tab...");
        const [newPage] = await Promise.all([
            this.playwrightContext.waitForEvent('page', { timeout: 15000 }),
            this.page.locator('.Recharge__container-rechageBtn').first().evaluate(el => el.click())
        ]);

        this.log("   New tab opened. Waiting for address...");
        await newPage.waitForLoadState('networkidle');
        
        const addressEl = newPage.locator('._address_span_1fhyb_295').first();
        await addressEl.waitFor({ state: 'visible', timeout: 15000 });
        const rawText = await addressEl.innerText();
        const address = rawText.trim();
        this.log(`   ✅ Extracted Address: ${address}`);

        this.publishEvent('DEPOSIT_UPDATE', { status: 'WAITING', address, failed: false });

        this.cancelDepositFlag = false;
        const waitMinutes = this.settings.autoDeposit?.waitTime || 5;
        this.log(`   ⏳ Waiting for ${waitMinutes} minutes for payment reflection...`);
        for (let i = 0; i < waitMinutes * 60; i++) {
            if (this.cancelDepositFlag) {
                this.log("   🛑 Deposit wait cancelled by user.");
                break;
            }
            await this.page.waitForTimeout(1000);
        }

        this.log("   Wait complete. Closing deposit tab...");
        await newPage.close();
        
        this.log("   Navigating back to game page...");
        await this.page.goto("https://bdg2030.com/#/login", { waitUntil: "domcontentloaded" });
        await this.page.waitForTimeout(4000);
        
        try {
            const winGoCard = this.page.locator(".lotterySlotItem").filter({ hasText: "Win Go 30s" }).first();
            await winGoCard.evaluate(el => el.click());
            this.log("   Clicked 'Win Go 30s'.");
        } catch (err) {
            this.log("   Could not find 'Win Go 30s' card after deposit: " + err.message);
        }
        await this.page.waitForTimeout(3000);

        this.isDepositing = false;
        this.log("   Deposit flow complete. Resuming normal operations.");
        
    } catch (err) {
        this.log(`   ❌ Deposit flow failed: ${err.message}`);
        this.isDepositing = false;
        this.depositFailed = true;
        this.publishEvent('DEPOSIT_UPDATE', { status: 'FAILED', address: null, failed: true });
        
        // Recover state: navigate back to game so betting can resume safely
        try {
            this.log("   Attempting to recover state and return to game...");
            await this.page.goto("https://bdg2030.com/#/login", { waitUntil: "domcontentloaded" });
            await this.page.waitForTimeout(4000);
            const winGoCard = this.page.locator(".lotterySlotItem").filter({ hasText: "Win Go 30s" }).first();
            await winGoCard.evaluate(el => el.click());
            await this.page.waitForTimeout(3000);
            this.log("   Successfully recovered to Game screen.");
        } catch (recoverErr) {
            this.log("   Could not recover to game screen: " + recoverErr.message);
        }
    }
  }
}

module.exports = PlaywrightBot;
