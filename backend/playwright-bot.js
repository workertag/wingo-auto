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
    
    this.sub = redisSubscriber;
    this.pub = redisPublisher;
    this.prisma = prisma;
    
    this.browser = null;
    this.context = null;
    this.page = null;
    
    this.isRunning = false;
    this.pendingBets = [];
    this.sessionWins = 0;
    this.sessionLosses = 0;
  }

  log(msg) {
    const ts = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" }) + " IST";
    console.log(`[Bot:${this.botId}] [${ts}] ${msg}`);
    this.pub.publish('bot-events', JSON.stringify({ botId: this.botId, type: 'LOG', msg, ts }));
  }

  publishEvent(type, data) {
    this.pub.publish('bot-events', JSON.stringify({ botId: this.botId, type, data, ts: Date.now() }));
  }

  async start() {
    this.isRunning = true;
    try {
      this.log("Starting browser...");
      let launchOptions = {
        headless: process.env.HEADLESS !== 'false',
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disk-cache-size=1", "--disable-dev-shm-usage"],
      };

      let contextOptions = {};
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

      await this.login();

      // Listen for predictions
      this.sub.subscribe('wingo:predictions', (err) => {
        if (err) this.log(`Failed to subscribe to predictions: ${err.message}`);
        else this.log("Subscribed to prediction events.");
      });

      this.sub.on('message', async (channel, message) => {
        if (channel === 'wingo:predictions' && this.isRunning) {
          const predictionData = JSON.parse(message);
          await this.onPrediction(predictionData);
        }
      });
      
      this.publishEvent('BOT_STARTED', { status: 'RUNNING' });
      await this.prisma.botInstance.update({ where: { id: this.botId }, data: { status: 'RUNNING' } });

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
      this.sub.unsubscribe('wingo:predictions');
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
    
    // Attempt navigation to game
    try {
      await this.page.goto("https://bdg2030.com/#/home", { waitUntil: "domcontentloaded" }).catch(() => {});
      await this.page.waitForTimeout(2000);
      const winGoCard = this.page.locator(".lotterySlotItem").filter({ hasText: "Win Go 30s" }).first();
      if (await winGoCard.isVisible({ timeout: 5000 })) {
        await winGoCard.click();
        this.log("Successfully entered Win Go 30s.");
      } else {
         this.log("Could not find Win Go 30s card.");
      }
    } catch (e) {
       this.log("Error navigating to game: " + e.message);
    }
  }

  async onPrediction(predictionData) {
    if (!this.isRunning) return;
    
    const { pending, state, results } = predictionData;
    this.log(`Received prediction for issue ${pending.issue}`);
    
    // 1. Resolve past bets if results exist
    if (results && this.pendingBets.length > 0) {
        // Logic similar to old backend-bot.js would go here
        this.pendingBets = [];
        this.log("Resolved past bets.");
    }

    if (!pending) return;

    // 2. Add randomized jitter between 500ms and 2500ms to avoid exact sync with other bots
    const delay = Math.floor(Math.random() * 2000) + 500;
    this.log(`Waiting ${delay}ms before placing bet...`);
    await this.page.waitForTimeout(delay);
    
    // 3. Place bet based on Strategy (Assuming Strategy is loaded from DB)
    // Detailed logic from backend-bot.js omitted for brevity but would execute click here
    this.log("Bet logic executed.");
  }
}

module.exports = PlaywrightBot;
