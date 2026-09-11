const { chromium } = require("playwright-extra");
const stealth = require("puppeteer-extra-plugin-stealth")();
chromium.use(stealth);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("https://bdg2030.com/");
  await page.waitForTimeout(5000);
  
  const keys = await page.evaluate(() => Object.keys(localStorage));
  console.log("LocalStorage Keys:", keys);
  
  await browser.close();
})();
