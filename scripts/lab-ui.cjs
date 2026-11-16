const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const out = process.argv[2];
  for (const [w, h, n] of [[1440, 900, 'd'], [390, 800, 'p']]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h }, hasTouch: n === 'p' })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    const ok = (name, c, x) => console.log(n, c ? 'PASS' : 'FAIL', name, x !== undefined ? JSON.stringify(x).slice(0, 200) : '');
    await p.goto('file://' + process.cwd() + '/dist/wrapped.html'); await p.waitForTimeout(500);
    await p.getByRole('button', { name: /Adult/ }).click(); await p.waitForTimeout(300);
    await p.evaluate(() => location.hash = 'lab'); await p.waitForTimeout(300); await p.screenshot({ path: `${out}/lab-${n}-home.png` });
    // mission 1: cable, address, ping
    await p.evaluate(() => location.hash = 'lab-first-link'); await p.waitForTimeout(400);
    const dev = (name) => p.locator(`svg [role=button][aria-label^="${name}"]`);
    const cable = async (a, bn) => { await p.getByRole('button', { name: 'Cable', exact: true }).click(); await dev(a).click(); await dev(bn).click(); await p.waitForTimeout(100); };
    await cable('PC1', 'S1'); await cable('PC2', 'S1');
    await dev('PC1').click(); await p.fill('#pc-ip', '192.168.1.10'); await p.fill('#pc-mask', '255.255.255.0');
    await dev('PC2').click(); await p.fill('#pc-ip', '192.168.1.20'); await p.fill('#pc-mask', '255.255.255.0');
    await dev('PC1').click(); await p.fill('#lab-target', '192.168.1.20'); await p.getByRole('button', { name: 'Send', exact: true }).click(); await p.waitForTimeout(900);
    await p.screenshot({ path: `${out}/lab-${n}-fly.png` }); await p.waitForTimeout(2600);
    const banner = await p.locator('p[aria-live=polite]').first().innerText(); ok('M1 ping animates and reports', /reply came back/.test(banner), banner);
    await p.getByRole('tab', { name: /Mission/ }).click(); ok('M1 complete', await p.getByText('Mission complete').isVisible());
    const st = () => p.evaluate(() => JSON.parse(localStorage.getItem('pippacket-progress-v1')));
    ok('M1 recorded with evidence', !!(await st()).labs['first-link'] && Object.keys((await st()).ev).some(k => k.includes('ip-and-mac')), (await st()).labs);
    // mission 3 through the terminal
    await p.evaluate(() => location.hash = 'lab-two-departments'); await p.waitForTimeout(400);
    await dev('PC1').click(); await p.fill('#lab-target', '192.168.1.13'); await p.getByRole('button', { name: 'Send', exact: true }).click(); await p.waitForTimeout(3200);
    ok('M3 starts with everyone reachable', /reply came back/.test(await p.locator('p[aria-live=polite]').first().innerText()));
    await dev('S1').click(); await p.waitForTimeout(150);
    for (const c of ['en', 'conf t', 'vlan 10', 'name Sales', 'vlan 20', 'name Engineering', 'int gi0/1', 'sw mo acc', 'sw acc vlan 10', 'int gi0/2', 'sw acc vlan 10', 'int gi0/3', 'sw acc vlan 20', 'int gi0/4', 'sw acc vlan 20', 'end', 'sh vlan br']) { await p.fill('#lab-cli', c); await p.keyboard.press('Enter'); }
    await p.waitForTimeout(200); const term = await p.locator('.font-code [aria-live]').innerText(); ok('terminal shows vlan table', /10\s+Sales\s+active\s+Gi0\/1, Gi0\/2/.test(term), term.slice(-200));
    await p.screenshot({ path: `${out}/lab-${n}-term.png` });
    await dev('PC1').click(); await p.fill('#lab-target', '192.168.1.13'); await p.getByRole('button', { name: 'Send', exact: true }).click(); await p.waitForTimeout(2600);
    const why = await p.locator('p[aria-live=polite]').first().innerText(); ok('M3 separation explained', /VLAN 10.*VLAN 20/.test(why), why);
    await p.getByRole('tab', { name: /Mission/ }).click(); ok('M3 complete 6/6', await p.getByText('Mission complete').isVisible() && /6\/6/.test(await p.getByRole('tab', { name: /Mission/ }).innerText()));
    await p.screenshot({ path: `${out}/lab-${n}-done.png` });
    // reload keeps the network; no new credit
    const evBefore = JSON.stringify((await st()).ev); await p.reload(); await p.waitForTimeout(500); ok('reload keeps work, no double credit', await p.getByText('Mission complete').isVisible() && JSON.stringify((await st()).ev) === evBefore);
    // skill tree shows lab skills
    await p.evaluate(() => location.hash = 'map'); await p.waitForTimeout(300); await p.getByRole('button', { name: 'Level 5, Certified' }).click();
    ok('tree: VLAN skill practising via lab', /Practising · CCNA 2.0 · 2.1/.test((await p.locator('li', { hasText: 'VLANs and access ports' }).innerText()).replace(/\n/g, ' ')));
    // sandbox
    await p.evaluate(() => location.hash = 'lab-sandbox'); await p.waitForTimeout(300); await p.getByRole('button', { name: '+ PC' }).click(); await p.getByRole('button', { name: '+ Router' }).click(); await p.waitForTimeout(100);
    ok('sandbox adds devices', (await p.locator('svg [role=button]').count()) === 2);
    ok('no overflow', (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0); console.log(n, 'errors', errs);
  } await b.close(); })().catch(e => { console.error('ERR', e.message.slice(0, 600)); process.exit(1); });
