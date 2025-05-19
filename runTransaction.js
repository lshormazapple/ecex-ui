const puppeteer = require('puppeteer');

const [,, username, password, inviteCode] = process.argv;

if (!username || !password || !inviteCode) {
  console.error("❌ Usage: node runTransaction.js <username> <password> <code>");
  process.exit(1);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-software-rasterizer'],
    timeout: 60000 
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) ' +
    'AppleWebKit/605.1.15 (KHTML, like Gecko) ' +
    'Version/14.0 Mobile/15E148 Safari/604.1'
  );

  await page.setViewport({
    width: 375,
    height: 812,
    isMobile: true,
    hasTouch: true
  });

  try {
    await page.goto('https://www.ecex688.com/#/pages/login/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await wait(6000);

    const inputs = await page.$$('input.uni-input-input');
    if (inputs.length < 2) throw new Error("Nema dovoljno input polja za login!");

    await inputs[0].type(username);
    await wait(1000);
    await inputs[1].type(password);
    await wait(1000);

    const loginBtn = await page.$('uni-view.btn.fc.bg-de.text-black');
    const loginBox = await loginBtn?.boundingBox();
    if (!loginBox) throw new Error("Login dugme nije pronađeno!");
    await page.touchscreen.tap(loginBox.x + loginBox.width / 2, loginBox.y + loginBox.height / 2);
    await wait(5000);

    await page.goto('https://www.ecex688.com/#/pages/trade/cut', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await wait(5000);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await wait(4000);

    const allViews = await page.$$('uni-view');
    let invitedMeBtn = null;

    for (const el of allViews) {
      const text = await page.evaluate(el => el.textContent.trim().toLowerCase(), el);
      if (text === 'invited me') {
        invitedMeBtn = el;
        break;
      }
    }

    if (!invitedMeBtn) throw new Error("'invited me' nije pronađen!");
    const inviteBox = await invitedMeBtn.boundingBox();
    await page.touchscreen.tap(inviteBox.x + inviteBox.width / 2, inviteBox.y + inviteBox.height / 2);
    await wait(3000);

    const codeInputs = await page.$$('input.uni-input-input');
    if (codeInputs.length < 2) throw new Error("Nema dovoljno input polja za kod!");
    await codeInputs[1].click();
    await codeInputs[1].type(inviteCode);
    await wait(4000);

    const sureBtn = await page.$('uni-view.orderGd_tag');
    const sureBox = await sureBtn?.boundingBox();
    if (!sureBox) throw new Error("'SURE' dugme nije pronađeno!");
    await page.touchscreen.tap(sureBox.x + sureBox.width / 2, sureBox.y + sureBox.height / 2);
    await wait(4000);

    console.log("✅ Kod uspešno unet i kliknuto 'SURE'");

  } catch (err) {
    console.error("❌ Greška:", err.message);
  } finally {
    await browser.close();
  }
})();
