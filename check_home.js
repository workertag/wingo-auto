const { chromium } = require("playwright-extra");
const stealth = require("puppeteer-extra-plugin-stealth")();
chromium.use(stealth);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("https://bdg2030.com/");
  await page.waitForTimeout(5000);
  
  const content = await page.content();
  const title = await page.title();
  
  console.log("Title:", title);
  console.log("Has Login link:", content.includes('#/login'));
  console.log("Has Win Go 30s:", content.includes('Win Go 30s'));
  
  await browser.close();
})();
