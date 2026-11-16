const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const out = process.argv[2];
  for (const [w, h, n] of [[1440, 900, 'd'], [390, 800, 'p']]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    const ok = (name, c, x) => console.log(n, c ? 'PASS' : 'FAIL', name, x !== undefined ? JSON.stringify(x).slice(0, 160) : '');
    await p.goto('file://' + process.cwd() + '/dist/wrapped.html'); await p.waitForTimeout(500);
    await p.getByRole('button', { name: /Adult/ }).click(); await p.waitForTimeout(300);
    await p.evaluate(() => location.hash = 'map'); await p.waitForTimeout(400);
    await p.screenshot({ path: `${out}/s1-${n}-learn.png`, fullPage: true });
    ok('tree shows', (await p.locator('main h1').innerText()) === 'The skill tree');
    const upFirst = await p.locator('section:has(h2:text("Up next")) button').first().innerText(); ok('up next starts at foundations', /What a network is/.test(upFirst), upFirst.replace(/\n/g, ' '));
    // finish two lessons with all-correct answers
    const finish = async (id, answers) => { await p.evaluate((id) => location.hash = 'lesson-' + id, id); await p.waitForTimeout(300); for (const a of answers) { await p.locator('#check button:not([disabled])').nth(a).click(); await p.locator('#check').getByRole('button', { name: /Next question|Finish/ }).click(); } await p.waitForTimeout(200); };
    await finish('what-is-a-network', [1, 1, 2]); await finish('meet-the-devices', [1, 2, 1]);
    const tag = await p.locator('main').getByText('Practising').first().isVisible(); ok('lesson shows Practising', tag);
    ok('review mark shown', await p.getByText('Not yet reviewed by an engineer').isVisible());
    const st = () => p.evaluate(() => JSON.parse(localStorage.getItem('pippacket-progress-v1')));
    ok('evidence stored', Object.keys((await st()).ev).length === 2, (await st()).ev);
    // today's practice
    await p.evaluate(() => location.hash = 'practice-today'); await p.waitForTimeout(300);
    let asked = 0; while (await p.getByText(/^Question \d+ of \d+$/).count()) { await p.locator('main .chunk button:not([disabled])').filter({ hasText: /^[A-D]/ }).first().click(); await p.getByRole('button', { name: /Next question|See how I did/ }).click(); asked++; await p.waitForTimeout(60); }
    ok('today asked mixed questions', asked >= 3 && asked <= 8, asked); await p.screenshot({ path: `${out}/s1-${n}-today.png` });
    // three separate days -> mastered
    await p.evaluate(() => { const k = 'pippacket-progress-v1'; const s = JSON.parse(localStorage.getItem(k)); const id = Object.keys(s.ev).find(x => x.includes('what-a-network')); s.ev[id] = { d: ['2026-11-10', '2026-11-12', new Date().toISOString().slice(0, 10)], m: 0 }; const id2 = Object.keys(s.ev).find(x => x.includes('meet')); s.ev[id2] = { d: s.ev[id2].d, m: 2 }; localStorage.setItem(k, JSON.stringify(s)); });
    await p.reload(); await p.waitForTimeout(400); await p.evaluate(() => location.hash = 'map'); await p.waitForTimeout(400);
    const tiles = await p.locator('main .grid.grid-cols-3 .chunk').allInnerTexts(); ok('counts: 1 mastered, 1 review', /1\s*Mastered/.test(tiles[0]) && /1\s*Need review/.test(tiles[2]), tiles.map(t => t.replace(/\n/g, ' ')));
    const up2 = await p.locator('section:has(h2:text("Up next")) button').first().innerText(); ok('review comes first in up next', /Meet the devices/.test(up2) && /Review it/.test(up2), up2.replace(/\n/g, ' '));
    await p.getByRole('button', { name: 'Level 5, Certified' }).click(); await p.waitForTimeout(200);
    ok('level 5 lists CCNA skills', await p.getByText('Single-area OSPFv2').isVisible() && await p.getByText('IPv4 addressing and subnetting').first().isVisible());
    await p.screenshot({ path: `${out}/s1-${n}-level5.png` });
    await p.evaluate(() => location.hash = 'me'); await p.waitForTimeout(300); ok('progress by strand', await p.getByText('By strand').isVisible());
    await p.evaluate(() => location.hash = ''); await p.waitForTimeout(300); await p.screenshot({ path: `${out}/s1-${n}-home.png` });
    ok('no overflow', (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0); console.log(n, 'errors', errs);
  } await b.close(); })().catch(e => { console.error('ERR', e.message.slice(0, 500)); process.exit(1); });
