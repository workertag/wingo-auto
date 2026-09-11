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
  PHONE: "9056822671",
  PASSWORD: "Sourav123",
};
const API_BASE = "https://wingo.yl.n3y.in";
const WS_URL = "wss://wingo.yl.n3y.in/api/ws?timer=30S";
const TIMER = "30S";
// =================================================================

// ========================= HOT-RELOAD ============================
const STRATEGY_PATH = path.resolve(__dirname, "strategy.js");

function loadStrategy() {
  // Clear the cached module so require() re-reads the file
  delete require.cache[require.resolve("./strategy")];
  try {
    const s = require("./strategy");
    return s;
  } catch (err) {
    log(`⚠️  Error loading strategy.js: ${err.message}`);
    return null;
  }
}

let strategy = loadStrategy();

// Watch strategy.js for changes and hot-reload
fs.watch(STRATEGY_PATH, (eventType) => {
  if (eventType === "change") {
    const prev = JSON.stringify(strategy);
    const next = loadStrategy();
    if (next) {
      strategy = next;
      const curr = JSON.stringify(strategy);
      if (prev !== curr) {
        log("🔄 strategy.js changed — hot-reloaded!");
        log(`   BET_BIG_SMALL: ${strategy.BET_BIG_SMALL ? "ON ✅" : "OFF ❌"}`);
        log(`   BET_RED_GREEN: ${strategy.BET_RED_GREEN ? "ON ✅" : "OFF ❌"}`);
        log(`   ALLOWED_QUALITIES: [${strategy.ALLOWED_QUALITIES.join(", ")}]`);
        log(`   Quantity:   ${strategy.BET_QUANTITY || "Formula 2^(level-1)"}`);
      }
    }
  }
});
// =================================================================

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

/**
 * Fetch prediction state from the API
 */
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

/**
 * Calculate bet quantity from level using Martingale: 2^(level-1)
 * Level 1 → 1, Level 2 → 2, Level 3 → 4, Level 4 → 8, ...
 */
function getBetQuantity(level) {
  const s = strategy;
  // Use custom table if provided
  if (s.BET_TABLE && s.BET_TABLE[level] !== undefined) {
    return s.BET_TABLE[level];
  }
  // Default formula: Base Bet * 2^(level-1)
  const baseBet = s.BASE_BET || 1;
  return baseBet * Math.pow(2, (level || 1) - 1);
}

/**
 * Place a bet by clicking the prediction button, setting quantity, and confirming.
 *
 * Popup structure:
 *   .lottery-container
 *     .amount-section  →  Balance buttons: 1, 10, 100, 1000
 *     .multiplier-section  →  Quantity: -, input, +  |  Multiplier: X1..X100
 *     .footer  →  Cancel | Total amount ₹X.XX
 */
async function placeBet(page, selector, label, level) {
  try {
    const quantity = getBetQuantity(level);
    log(`  Clicking ${label} button (Level ${level}, Qty ${quantity})...`);

    // Step 1: Click the bet button (Big/Small/Red/Green/Violet)
    const btn = page.locator(selector).first();
    try {
      await btn.click({ timeout: 2000 });
    } catch (e) {
      log(`  ⚠️ Normal click intercepted, forcing via JS...`);
      await btn.evaluate(node => node.click());
    }
    await page.waitForTimeout(1500);

    // Step 2: Wait for the betting popup to appear
    const popup = page.locator('.lottery-container');
    await popup.waitFor({ state: 'visible', timeout: 3000 });
    log(`  Popup opened.`);

    // Step 3: Set quantity using JavaScript to bypass Vue reactivity issues
    if (quantity > 1) {
      await page.evaluate((qty) => {
        const input = document.querySelector('.multiplier-section input[type="number"]');
        if (input) {
          // Use native setter to bypass Vue's getter/setter
          const nativeSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 'value'
          ).set;
          nativeSetter.call(input, qty);
          // Dispatch events to trigger Vue's v-model
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, String(quantity));
      log(`  Set quantity to ${quantity}`);
      await page.waitForTimeout(500);
    }

    // Step 4: Click the "Total amount" confirm button inside the popup
    log(`  Confirming bet...`);
    const confirmBtn = popup.locator('button.bet-amount');
    await confirmBtn.waitFor({ state: 'visible', timeout: 3000 });
    await confirmBtn.click({ force: true });
    await page.waitForTimeout(1000);

    log(`  ✅ ${label} L${level} bet placed — ₹${quantity}.00`);
    return true;
  } catch (err) {
    log(`  ❌ Failed to place ${label} bet: ${err.message}`);
    return false;
  }
}

/**
 * Handle a new round: fetch prediction and place bets
 */
let isBetting = false; // Prevent double-betting from overlapping WS messages

async function onNewRound(page) {
  if (isBetting) {
    log("⚠️  Already placing a bet, skipping duplicate WS trigger.");
    return;
  }
  isBetting = true;

  try {
    log("🔔 New round detected! Fetching prediction...");
    const apiState = await fetchPrediction();
    const pending = apiState.pending;
    const engineState = apiState.state; // Contains bsLevel, rgLevel (numeric!)

    if (!pending) {
      log("⚠️  No pending prediction available. Skipping this round.");
      return;
    }

    // Numeric Martingale levels from engine state
    const bsLevel = engineState?.bsLevel || 1;
    const rgLevel = engineState?.rgLevel || 1;

    log(`📊 Prediction for issue ${pending.issue}:`);
    log(`   BS: ${pending.bsPred || "NO SIGNAL"} (Quality: ${pending.bsQuality}, Level: L${bsLevel}, Layer: ${pending.bsLayer})`);
    log(`   RG: ${pending.rgPred || "NO SIGNAL"} (Quality: ${pending.rgQuality}, Level: L${rgLevel}, Layer: ${pending.rgLayer})`);

    // Read live strategy (hot-reloaded)
    const s = strategy;

    // ---- Big / Small ----
    if (s.BET_BIG_SMALL && pending.bsPred) {
      if (bsLevel > (s.MAX_LEVEL || 12)) {
        log(`   🛑 Skipping BS bet — Level ${bsLevel} exceeds MAX_LEVEL ${s.MAX_LEVEL || 12}`);
      } else if (bsLevel < (s.MIN_LEVEL || 1)) {
        log(`   🛑 Skipping BS bet — Level ${bsLevel} is below MIN_LEVEL ${s.MIN_LEVEL || 1}`);
      } else if (s.ALLOWED_QUALITIES.includes(pending.bsQuality)) {
        const selector =
          pending.bsPred === "BIG"
            ? ".Betting__C-foot-b"
            : ".Betting__C-foot-s";
        await placeBet(page, selector, pending.bsPred, bsLevel);
      } else {
        log(`   ⏭️  Skipping BS bet — quality "${pending.bsQuality}" not in [${s.ALLOWED_QUALITIES}]`);
      }
    }

    // ---- Red / Green / Violet ----
    if (s.BET_RED_GREEN && pending.rgPred) {
      if (rgLevel > (s.MAX_LEVEL || 12)) {
        log(`   🛑 Skipping RG bet — Level ${rgLevel} exceeds MAX_LEVEL ${s.MAX_LEVEL || 12}`);
      } else if (rgLevel < (s.MIN_LEVEL || 1)) {
        log(`   🛑 Skipping RG bet — Level ${rgLevel} is below MIN_LEVEL ${s.MIN_LEVEL || 1}`);
      } else if (s.ALLOWED_QUALITIES.includes(pending.rgQuality)) {
        let selector;
        switch (pending.rgPred) {
          case "RED":    selector = ".Betting__C-head-red"; break;
          case "GREEN":  selector = ".Betting__C-head-green"; break;
          case "VIOLET": selector = ".Betting__C-head-violet"; break;
          default:
            log(`   ⚠️  Unknown RG prediction: ${pending.rgPred}`);
            return;
        }
        await placeBet(page, selector, pending.rgPred, rgLevel);
      } else {
        log(`   ⏭️  Skipping RG bet — quality "${pending.rgQuality}" not in [${s.ALLOWED_QUALITIES}]`);
      }
    }
  } catch (err) {
    log(`❌ Error in onNewRound: ${err.message}`);
  } finally {
    isBetting = false;
  }
}

/**
 * Connect to prediction WebSocket with auto-reconnect
 */
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
        // Small delay to let the website UI update for the new round
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

// ========================= MAIN =========================
(async () => {
  log("Starting Wingo bot...");
  const userDataDir = "./user-data";
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page =
    context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  // Helper function to close popups
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
      const dismissBtn = page
        .locator('text="Don\'t log in yet, continue browsing"')
        .first();
      if (await dismissBtn.isVisible({ timeout: 1000 })) {
        await dismissBtn.click();
        log("Dismissed Event Rewards popup.");
        await page.waitForTimeout(1000);
      }
    } catch (err) {}
    try {
      const firstRechargeClose = page
        .locator(".first-recharge-queue-dialog__close")
        .first();
      if (await firstRechargeClose.isVisible({ timeout: 1000 })) {
        await firstRechargeClose.click();
        log("Closed First Deposit Bonus popup.");
        await page.waitForTimeout(1000);
      }
    } catch (err) {}
  };

  // ---- Login ----
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
    const loginBtn = page
      .locator('text=/log\\s*in/i, text=/sign\\s*in/i, button:visible')
      .first();
    await loginBtn.click({ timeout: 2000 });
  } catch (err) {
    await page.press('input[placeholder="Password"]', "Enter");
  }

  log("Waiting for login response...");
  await page.waitForTimeout(5000);

  // Close popups after login
  await closePopups();
  await page.waitForTimeout(1000);
  await closePopups();

  // ---- Navigate to Win Go 30s ----
  log("Clicking on 'Win Go 30s' card...");
  try {
    const winGoCard = page
      .locator(".lotterySlotItem")
      .filter({ hasText: "Win Go 30s" })
      .first();
    await winGoCard.click({ timeout: 5000 });
    log("Clicked 'Win Go 30s'.");
  } catch (err) {
    log("Could not find 'Win Go 30s' card: " + err.message);
  }

  await page.waitForTimeout(3000);
  await closePopups();

  await page.screenshot({ path: "ready-to-bet.png" });
  log("✅ Bot is ready on the Win Go 30s page!");

  // ---- Print strategy ----
  log("========================================");
  log("  BETTING STRATEGY (hot-reloadable)");
  log(`  Big/Small:  ${strategy.BET_BIG_SMALL ? "ON ✅" : "OFF ❌"}`);
  log(`  Red/Green:  ${strategy.BET_RED_GREEN ? "ON ✅" : "OFF ❌"}`);
  log(`  Qualities:  [${strategy.ALLOWED_QUALITIES.join(", ")}]`);
  log(`  Quantity:   ${strategy.BET_QUANTITY || "Formula 2^(level-1)"}`);
  log("  📝 Edit strategy.js to change — auto-reloads!");
  log("========================================");

  // ---- Connect to prediction engine ----
  connectWebSocket(page);

  // Keep alive forever
  await new Promise(() => {});
})();
