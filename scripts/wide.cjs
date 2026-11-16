const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 800 } });
  await p.goto('file://' + process.cwd() + '/dist/wrapped.html#lesson-ipv6'); await p.waitForTimeout(600);
  console.log(await p.evaluate(() => [...document.querySelectorAll('body *')].filter(e => { if (e.getBoundingClientRect().right <= innerWidth + 1) return false; for (let a = e.parentElement; a; a = a.parentElement) if (getComputedStyle(a).overflowX !== 'visible') return false; return true; }).slice(0, 5).map(e => e.tagName + '.' + String(e.className).slice(0, 70) + ' r' + Math.round(e.getBoundingClientRect().right) + ' | ' + e.textContent.slice(0, 50))));
  await b.close(); })();
