const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const out = process.argv[2];
  for (const [w, n, scheme] of [[1440, 'd', 'light'], [390, 'p', 'dark']]) {
    const p = await (await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + process.cwd() + '/dist/wrapped.html#challenge-q-4821-7'); await p.waitForTimeout(600);
    const h = await p.locator('main h1').innerText(); await p.getByRole('button', { name: /Take the challenge/ }).click();
    for (let i = 0; i < 10; i++) { await p.locator('main button:not([disabled])').filter({ hasText: /^[A-D]/ }).nth(0).click(); await p.getByRole('button', { name: /Next question|See who won/ }).click(); }
    await p.waitForTimeout(300); const r = await p.locator('main h2').innerText(); const sc = await p.locator('main p.font-mono').innerText(); await p.screenshot({ path: `${out}/h2-${n}-chal.png` });
    await p.evaluate(() => location.hash = 'me'); await p.waitForTimeout(900); await p.locator('img[alt^="Share card"]').scrollIntoViewIfNeeded(); await p.screenshot({ path: `${out}/h2-${n}-share.png` });
    await p.evaluate(() => location.hash = 'bogus-thing'); await p.waitForTimeout(200);
    console.log(n, h, '|', r, sc, '| overflow', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth), errs);
  } await b.close(); })().catch(e => { console.error('ERR', e.message.slice(0, 300)); process.exit(1); });
