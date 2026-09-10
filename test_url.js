const { chromium } = require("playwright-extra");
const stealth = require("puppeteer-extra-plugin-stealth")();

chromium.use(stealth);

(async () => {
  const context = await chromium.launchPersistentContext('./user-data-test', {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = context.pages()[0];
  await page.goto("https://bdg2030.com/");
  await page.waitForTimeout(5000);
  
  const url = page.url();
  console.log("URL after navigating to base:", url);
  await context.close();
})();
