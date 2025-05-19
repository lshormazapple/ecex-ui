const puppeteer = require('puppeteer');
require('dotenv').config();

const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;
const inviteCode = process.argv[2];

if (!USERNAME || !PASSWORD || !inviteCode) {
  console.error("❌ USERNAME, PASSWORD ili kod nisu prosleđeni!");
  process.exit(1);
}

function randomWait(min = 5000, max = 8000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

async function launchBrowserWithRetries(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
        ],
        timeout: 60000
      });
      return browser;
    } catch (err) {
      console.warn(`⚠️ Puppeteer pokušaj ${i + 1} nije uspeo: ${err.message}`);
      if (i < maxRetries - 1) await randomWait(2000, 4000);
    }
  }
  throw new Error('❌ Chromium nije mogao da se pokrene ni nakon 3 pokušaja.');
}

const MAX_RETRIES = 3;

(async () => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`🔁 Pokušaj ${attempt}...`);

    let browser;
    try {
      browser = await launchBrowserWithRetries();

      const page = await browser.newPage();

      await page.setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) ' +
        'AppleWebKit/605.1.15 (KHTML, like Gecko) ' +
        'Version/14.0 Mobile/15E148 Safari/604.1'
      );

      await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });

      await page.goto('https://www.ecex688.com/#/pages/login/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
      await randomWait();

      await page.waitForSelector('input.uni-input-input', { visible: true, timeout: 10000 });
      const inputs = await page.$$('input.uni-input-input');
      if (inputs.length < 2) throw new Error("Nema dovoljno input polja za login!");

      await inputs[0].type(USERNAME);
      await randomWait();
      await inputs[1].type(PASSWORD);
      await randomWait();

      await page.waitForSelector('uni-view.btn.fc.bg-de.text-black', { visible: true, timeout: 10000 });
      const loginBtn = await page.$('uni-view.btn.fc.bg-de.text-black');
      const loginBox = await loginBtn.boundingBox();
      if (!loginBox) throw new Error("Login dugme nije pronađeno!");

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }),
        page.touchscreen.tap(loginBox.x + loginBox.width / 2, loginBox.y + loginBox.height / 2)
      ]);
      await randomWait();

      await page.goto('https://www.ecex688.com/#/pages/trade/cut', { waitUntil: 'domcontentloaded', timeout: 60000 });
      await randomWait();

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await randomWait();

      const allViews = await page.$$('uni-view');
      let invitedMeBtn = null;
      for (const el of allViews) {
        const text = await page.evaluate(el => el.textContent?.trim().toLowerCase(), el);
        if (text === 'invited me') {
          invitedMeBtn = el;
          break;
        }
      }

      if (!invitedMeBtn) throw new Error("'invited me' nije pronađen!");
      const inviteBox = await invitedMeBtn.boundingBox();
      if (!inviteBox) throw new Error("'invited me' nema boundingBox!");
      await page.touchscreen.tap(inviteBox.x + inviteBox.width / 2, inviteBox.y + inviteBox.height / 2);
      await randomWait();

      await page.waitForSelector('input.uni-input-input', { visible: true, timeout: 10000 });
      const codeInputs = await page.$$('input.uni-input-input');
      if (codeInputs.length < 2) throw new Error("Nema dovoljno input polja za kod!");
      await codeInputs[1].click();
      await codeInputs[1].type(inviteCode);
      await randomWait();

      await page.waitForSelector('uni-view.orderGd_tag', { visible: true, timeout: 10000 });
      const sureBtn = await page.$('uni-view.orderGd_tag');
      const sureBox = await sureBtn?.boundingBox();
      if (!sureBox) throw new Error("'SURE' dugme nije pronađeno!");
      await page.touchscreen.tap(sureBox.x + sureBox.width / 2, sureBox.y + sureBox.height / 2);
      await randomWait();

      console.log("✅ Kod uspešno unet i kliknuto 'SURE'");
      await browser.close();
      break;

    } catch (err) {
      console.error(`❌ Greška pri pokušaju ${attempt}:`, err.message);
      if (browser) await browser.close();
      if (attempt === MAX_RETRIES) {
        console.error("❌ Svi pokušaji neuspešni. Prekida se.");
        process.exit(1);
      } else {
        await randomWait(2000, 4000);
      }
    }
  }
})();
