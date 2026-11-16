
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const out = process.argv[2];
  for (const [w, h, n, scheme] of [[1280, 800, 'd', 'light'], [390, 780, 'p', 'light']]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, hasTouch: n === 'p' })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + process.cwd() + '/dist/wrapped.html'); await p.waitForTimeout(500);
    await p.getByRole('button', { name: /Ages 5 to 7/ }).click(); await p.waitForTimeout(300); await p.screenshot({ path: `${out}/k-${n}-home.png` });
    await p.getByRole('button', { name: /Help Pip/ }).click(); await p.waitForTimeout(300);
    await p.getByRole('button', { name: /Let's go/ }).click(); await p.waitForTimeout(200);
    for (const i of [1, 2, 3]) { await p.getByRole('button', { name: `Helper ${i}`, exact: true }).first().click({ force: true }); await p.waitForTimeout(800); }
    await p.screenshot({ path: `${out}/k-${n}-pip1.png` });
    const mid = await p.locator('[aria-live]').first().innerText();
    await p.getByRole('button', { name: /Send Pip again/ }).click(); await p.waitForTimeout(300);
    await p.getByRole('button', { name: 'Closed helper' }).click({ force: true }); await p.waitForTimeout(200); const oops = await p.locator('[aria-live]').first().innerText();
    await p.screenshot({ path: `${out}/k-${n}-pip2.png` });
    for (const i of [1, 2, 3]) { await p.getByRole('button', { name: `Helper ${i}`, exact: true }).last().click({ force: true }); await p.waitForTimeout(800); }
    const end = await p.locator('[aria-live]').first().innerText(); await p.screenshot({ path: `${out}/k-${n}-pip3.png` });
    await p.getByRole('button', { name: /All done/ }).click(); await p.waitForTimeout(300); const stars = await p.locator('[aria-label$="stars"]').innerText();
    // gate
    await p.getByRole('button', { name: /Grown-ups/ }).first().click(); await p.waitForTimeout(300);
    const qm = (await p.locator('label[for=gate]').innerText()).match(/(\d+) × (\d+)/); await p.fill('#gate', String(qm[1] * qm[2])); await p.getByRole('button', { name: 'Continue' }).click(); await p.waitForTimeout(300);
    await p.getByRole('button', { name: /Ages 8 to 10/ }).click(); await p.waitForTimeout(300);
    await p.getByRole('button', { name: /Light-switch/ }).click(); await p.waitForTimeout(200); await p.getByRole('button', { name: /Start cracking/ }).click();
    for (const t of [1, 2, 3, 5, 6, 9, 12, 15]) { for (const wv of [8, 4, 2, 1]) if (t & wv) await p.getByRole('button', { name: `Light worth ${wv}`, exact: true }).click(); if (t === 5) await p.screenshot({ path: `${out}/k-${n}-lights.png` }); await p.getByRole('button', { name: /Next puzzle|Finish/ }).click(); await p.waitForTimeout(100); }
    const fin = await p.locator('[aria-live]').first().innerText();
    await p.evaluate(() => location.hash = 'map'); await p.waitForTimeout(200); const blocked = await p.locator('main h1').innerText();
    await p.evaluate(() => location.hash = 'who'); await p.waitForTimeout(200); const gated = await p.locator('main h1').innerText();
    console.log(n, '|', mid.slice(0, 20), '|', oops.slice(0, 22), '|', end.slice(0, 12), '| stars', stars.trim(), '|', fin.slice(0, 13), '| map->', blocked, '| who->', gated, '| overflow', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth), errs);
  } await b.close(); })().catch(e => { console.error('ERR', e.message.slice(0, 400)); process.exit(1); });
