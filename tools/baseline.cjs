const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const games = fs.readdirSync(path.resolve(__dirname, '..')).filter(name => name !== 'find_mom_3d' && fs.existsSync(path.resolve(__dirname, '..', name, 'index.html')));
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const results = [];
  fs.mkdirSync(path.join(__dirname, '../.qa'), { recursive: true });
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, isMobile: width === 390, hasTouch: width === 390 });
    await context.route('https://**/*', route => route.abort());
    for (const game of ['home', ...games]) {
      const page = await context.newPage(); const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://127.0.0.1:4174/' + (game === 'home' ? '' : game + '/'), { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(450);
      const layout = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, title: document.title, height: document.documentElement.scrollHeight, bodyOverflow: getComputedStyle(document.body).overflow }));
      results.push({ game, width, errors, ...layout });
      if (width === 390 || game === 'home') await page.screenshot({ path: path.join(__dirname, '../.qa/before-' + game + '-' + width + '.png') });
      await page.close();
    }
    await context.close();
  }
  fs.writeFileSync(path.join(__dirname, '../.qa/baseline.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results)); await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
