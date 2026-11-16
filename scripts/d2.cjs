const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const out = process.argv[2];
  for (const [w, n] of [[1440, 'd'], [390, 'p']]) {
    const p = await (await b.newContext({ viewport: { width: w, height: 900 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + process.cwd() + '/dist/wrapped.html'); await p.waitForTimeout(400); await p.getByRole('button', { name: /Adult/ }).click();
    let over = [];
    for (const id of ['vlans', 'trunks', 'etherchannel', 'svi', 'edge-ports', 'cdp-lldp', 'l2-troubleshooting', 'rapid-pvst']) { await p.evaluate((id) => location.hash = 'lesson-' + id, id); await p.waitForTimeout(250); const o = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (o > 0) over.push(id + ':' + o); if (!(await p.locator('main h1').innerText()).length || await p.getByText("isn't on the map").count()) over.push(id + ':missing'); }
    await p.evaluate(() => location.hash = 'lesson-svi'); await p.waitForTimeout(300); const lab = await p.getByRole('button', { name: /Open the lab/ }).isVisible(); await p.screenshot({ path: `${out}/d2-${n}-svi.png` });
    await p.getByRole('button', { name: /Open the lab/ }).click(); await p.waitForTimeout(400); const t = await p.locator('main h1').innerText();
    console.log(n, 'problems', over, '| lab link', lab, '->', t, '| errs', errs);
  } await b.close(); })().catch(e => { console.error('ERR', e.message.slice(0, 300)); process.exit(1); });
