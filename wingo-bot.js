const { chromium } = require("playwright-extra");
const stealth = require("puppeteer-extra-plugin-stealth")();

// Register stealth plugin
chromium.use(stealth);

(async () => {
  console.log("Starting Wingo bot...");
  const userDataDir = './user-data';
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  console.log("Navigating to the homepage https://bdg2030.com/ ...");
  try {
    await page.goto("https://bdg2030.com/", { waitUntil: "networkidle" });
  } catch (error) {
    console.error("Navigation error:", error.message);
  }

  await page.waitForTimeout(3000);

  // Helper function to close popup
  const closePopup = async () => {
    try {
      const confirmBtn = page.locator('.announcement-dialog__button').first();
      if (await confirmBtn.isVisible({ timeout: 2000 })) {
        await confirmBtn.click();
        console.log("Clicked Confirm button on the popup.");
        await page.waitForTimeout(1000);
      }
    } catch (err) {
      // Ignore
    }
  };

  await closePopup();

  console.log("Checking login state by clicking on 'Win Go 30s' card...");
  try {
    const winGoCard = page.locator('.lotterySlotItem').filter({ hasText: 'Win Go 30s' }).first();
    await winGoCard.click({ timeout: 5000 });
  } catch (err) {
    console.log("Could not find 'Win Go 30s' card on homepage.", err.message);
  }

  await page.waitForTimeout(2000);

  // If clicking Win Go redirected us to the login page, the login form will be visible
  const phoneInput = page.locator('input[name="userNumber"]');
  const isLoginFormVisible = await phoneInput.isVisible().catch(() => false);

  if (isLoginFormVisible) {
    console.log("We are not logged in. Login form detected. Filling in phone number...");
    await page.fill('input[name="userNumber"]', '9056822671');

    console.log("Filling in password...");
    await page.fill('input[placeholder="Password"]', 'Sourav123');

    console.log("Clicking login button...");
    await page.screenshot({ path: 'before-login.png' });

    try {
       const loginBtn = page.locator('text=/log\\s*in/i, text=/sign\\s*in/i, button:visible').first();
       await loginBtn.click({ timeout: 2000 });
    } catch (err) {
       await page.press('input[placeholder="Password"]', 'Enter');
    }

    console.log("Waiting for navigation or login response...");
    await page.waitForTimeout(5000); 

    await page.screenshot({ path: 'after-login-attempt.png' });
    console.log("Screenshot saved to after-login-attempt.png");

    console.log("Re-closing announcement popup if it appeared after login...");
    await closePopup();

    console.log("Clicking 'Win Go 30s' again now that we are logged in...");
    try {
      const winGoCard = page.locator('.lotterySlotItem').filter({ hasText: 'Win Go 30s' }).first();
      await winGoCard.click({ timeout: 5000 });
    } catch (err) {
      console.log("Could not find 'Win Go 30s' card.", err.message);
    }

  } else {
    console.log("Already logged in! The persistent session worked perfectly.");
  }

  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'after-wingo-click.png' });
  console.log("Screenshot saved to after-wingo-click.png");

  console.log("Login and navigation complete. Leaving browser open...");
  // Keep the script running so the browser doesn't close
  await new Promise(() => {});
})();
