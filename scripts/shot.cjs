const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font:14px system-ui}[hidden]{display:none!important}img{max-width:100%}</style><style>@font-face{font-family:Playfair Display;src:url(file:///home/claude/brices-site/node_modules/@fontsource-variable/playfair-display/files/playfair-display-latin-wght-normal.woff2);font-weight:400 900}@font-face{font-family:Playfair Display;font-style:italic;src:url(file:///home/claude/brices-site/node_modules/@fontsource-variable/playfair-display/files/playfair-display-latin-wght-italic.woff2);font-weight:400 900}@font-face{font-family:Pinyon Script;src:url(file:///home/claude/brices-site/node_modules/@fontsource/pinyon-script/files/pinyon-script-latin-400-normal.woff2)}@font-face{font-family:Arimo;src:url(file:///home/claude/brices-site/node_modules/@fontsource/arimo/files/arimo-latin-400-normal.woff2);font-weight:400}@font-face{font-family:Arimo;src:url(file:///home/claude/brices-site/node_modules/@fontsource/arimo/files/arimo-latin-700-normal.woff2);font-weight:700}</style></head><body>' + fs.readFileSync('dist/hopcount-preview.html', 'utf8') + '</body></html>';
  fs.writeFileSync('dist/wrapped.html', html);
  const b = await chromium.launch();
  const out = process.argv[2];
  for (const [w, h, n, scheme] of [[1440, 900, 'd', 'light'], [390, 800, 'p', 'dark']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme });
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && !/fonts|ERR_/.test(m.text()) && errs.push(m.text().slice(0, 120)));
    await p.goto('file://' + process.cwd() + '/dist/wrapped.html'); await p.waitForTimeout(700);
    const over = async (tag) => { const o = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (o > 0) console.log(n, tag, 'OVERFLOW', o); };
    await p.screenshot({ path: `${out}/h-${n}-home.png` }); await over('home');
    await p.evaluate(() => location.hash = 'map'); await p.waitForTimeout(300); await p.screenshot({ path: `${out}/h-${n}-map.png` }); await over('map');
    for (const id of ['how-data-travels', 'binary', 'ipv4-subnetting', 'client-connectivity', 'dhcp', 'wireless', 'cable-issues', 'ipv6', 'virtualization']) { await p.evaluate((id) => location.hash = 'lesson-' + id, id); await p.waitForTimeout(200); await over(id); }
    await p.evaluate(() => location.hash = 'lesson-ipv4-subnetting'); await p.waitForTimeout(300);
    await p.screenshot({ path: `${out}/h-${n}-lesson.png` });
    // finish a lesson quiz
    await p.evaluate(() => location.hash = 'lesson-what-is-a-network'); await p.waitForTimeout(300);
    for (let i = 0; i < 3; i++) { await p.locator('#check button:not([disabled])').nth(1).click(); await p.locator('#check').getByRole('button', { name: /Next question|Finish/ }).click(); }
    await p.waitForTimeout(300); const res = await p.locator('#check h2').innerText(); 
    await p.locator('#check').scrollIntoViewIfNeeded(); await p.screenshot({ path: `${out}/h-${n}-done.png` });
    // subnet trainer: compute answer in page and submit
    await p.evaluate(() => location.hash = 'practice-subnet'); await p.waitForTimeout(300);
    const txt = await p.locator('p.font-code.text-2xl').innerText(); const [ip, pre] = txt.replace(/\s/g, '').split('/');
    const o = ip.split('.').map(Number); const n32 = ((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0; const mask = (0xffffffff << (32 - pre)) >>> 0; const net = (n32 & mask) >>> 0; const bc = (net | (~mask >>> 0)) >>> 0; const s = v => [v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join('.');
    await p.fill('#sub-net', s(net)); await p.fill('#sub-bc', s(bc)); await p.fill('#sub-hosts', String(2 ** (32 - pre) - 2)); await p.getByRole('button', { name: 'Check' }).click(); await p.waitForTimeout(200);
    const sub = await p.locator('[aria-live] p').first().innerText(); await p.screenshot({ path: `${out}/h-${n}-subnet.png` }); await over('subnet');
    await p.evaluate(() => location.hash = 'practice-cards'); await p.waitForTimeout(300); await over('cards'); const cards = await p.locator('main').innerText();
    await p.evaluate(() => location.hash = 'start'); await p.waitForTimeout(300);
    for (let i = 0; i < 8; i++) { await p.locator('main button:not([disabled])').filter({ hasText: /^[A-D]/ }).nth(i < 6 ? [1,1,0,1,1,1][i] : 3).click(); await p.getByRole('button', { name: /Next question|Show my/ }).click(); }
    await p.waitForTimeout(300); const place = await p.locator('main h2').first().innerText(); await p.screenshot({ path: `${out}/h-${n}-start.png` });
    await p.evaluate(() => location.hash = 'me'); await p.waitForTimeout(300); await p.screenshot({ path: `${out}/h-${n}-me.png` }); await over('me');
    await p.evaluate(() => location.hash = 'map'); await p.waitForTimeout(400); await p.screenshot({ path: `${out}/h-${n}-map2.png` });
    console.log(n, '|', res, '|', sub, '|', cards.split('\n').slice(4, 6).join(' / ').slice(0, 80), '|', place, '| errs', errs);
  }
  await b.close();
})().catch(e => { console.error('ERR', e.message.slice(0, 400)); process.exit(1); });
