const { chromium } = require('playwright-core');
const EXE = '/home/user/.local/share/choreographer/deps/chrome-linux64/chrome';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: EXE, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1360, height: 800 } });
  await page.goto('http://localhost:8001/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(1100);
  // type into the FORMULA BAR (not in-cell): SUM without '='
  await page.evaluate(() => { X.commitCell(0, 0, 5); X.setSel({ r: 2, c: 2 }, { r: 2, c: 2 }, 'cell'); });
  await page.click('#fx-input');
  await page.waitForTimeout(150);
  await page.keyboard.insertText('=SUM(A1)*2');
  await page.waitForTimeout(150);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  const r = await page.evaluate(() => {
    const cd = X.cellGet(2, 2), d = X.cellDisplay(2, 2);
    return { t: cd && cd.t, v: cd && cd.v, num: cd && cd.num, disp: d && d.text, sel: JSON.stringify(X.state.sel.a) };
  });
  console.log('fx-bar commit:', JSON.stringify(r));
  await browser.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(2); });
