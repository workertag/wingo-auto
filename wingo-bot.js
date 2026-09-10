const { chromium } = require("playwright-extra");
const stealth = require("puppeteer-extra-plugin-stealth")();

// Register stealth plugin
chromium.use(stealth);

(async () => {
  console.log("Starting Wingo bot...");
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Navigating to https://bdg2030.com/#/login...");
  try {
    await page.goto("https://bdg2030.com/#/login", { waitUntil: "networkidle" });
  } catch (error) {
    console.error("Navigation error:", error.message);
  }

  // Wait for the form to appear
  await page.waitForTimeout(3000);

  console.log("Filling in phone number...");
  await page.fill('input[name="userNumber"]', '9056822671');

  console.log("Filling in password...");
  await page.fill('input[placeholder="Password"]', 'Sourav123');

  console.log("Clicking login button...");
  await page.screenshot({ path: 'before-login.png' });

  // Try to find the login button by text or use Enter key
  try {
     const loginBtn = page.locator('text=/log\\s*in/i, text=/sign\\s*in/i, button:visible').first();
     await loginBtn.click({ timeout: 2000 });
  } catch (err) {
     console.log("Could not easily find login button by text, falling back to pressing Enter on password field...");
     await page.press('input[placeholder="Password"]', 'Enter');
  }

  console.log("Waiting for navigation or login response...");
  await page.waitForTimeout(5000); // Give it some time to process

  await page.screenshot({ path: 'after-login-attempt.png' });
  console.log("Screenshot saved to after-login-attempt.png");

  console.log("Login complete. Leaving browser open...");
  // Keep the script running so the browser doesn't close
  await new Promise(() => {});
})();
