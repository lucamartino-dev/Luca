// Render deck slides (project/deck.json + slides) to PNGs and a PDF, approximating the Slides runtime.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const [root, out, only] = process.argv.slice(2);
const deck = JSON.parse(fs.readFileSync(path.join(root, 'project/deck.json'), 'utf8'));
const logo = 'data:image/png;base64,' + fs.readFileSync(process.env.LOGO).toString('base64');
let ids = deck.order.filter(id => fs.existsSync(path.join(root, 'project/slides', id + '.html')));
if (only) ids = ids.filter(id => only.split(',').includes(id));
const fonts = Object.values(deck.faces).map(f => `<link rel="stylesheet" href="${f.href}">`).join('');
const css = `*{box-sizing:border-box;margin:0}body{margin:0;background:#888}
section{position:relative;width:1920px;height:1080px;overflow:hidden;display:flex;flex-direction:column;page-break-after:always}
aside{display:none}h1,h2,h3{font-weight:600}ul,ol{padding-left:1.2em}
table{border-collapse:collapse}td,th{padding:0.35em 0.6em;border-bottom:1px solid #DADDE2;text-align:left;vertical-align:top}
x-shape{display:block;flex:none}x-shape[kind=arrow-right]{clip-path:polygon(0 30%,60% 30%,60% 0,100% 50%,60% 100%,60% 70%,0 70%)}
x-shape[kind=arrow-down]{clip-path:polygon(30% 0,70% 0,70% 60%,100% 60%,50% 100%,0 60%,30% 60%)}
x-shape[kind=ellipse]{border-radius:50%}x-icon{display:inline-block;width:32px;height:32px}`;
const body = ids.map(id => fs.readFileSync(path.join(root, 'project/slides', id + '.html'), 'utf8').replace(/\/_blob\/[0-9a-f]+/g, logo)).join('\n');
const html = `<!doctype html><html><head><meta charset="utf-8">${fonts}<style>${css}</style></head><body>${body}</body></html>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.setContent(html, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready);
  fs.mkdirSync(out, { recursive: true });
  // overflow report: elements whose box exceeds the 1080 canvas or overlaps the footer band
  const issues = await p.evaluate(() => [...document.querySelectorAll('section')].map(s => {
    const r = s.getBoundingClientRect(); const bad = [];
    s.querySelectorAll('p,h1,h2,h3,td,div,li').forEach(e => { const q = e.getBoundingClientRect();
      if (e.closest('[style*="position:absolute"]')) return;
      if (q.bottom - r.top > 925 && q.height > 0 && e.children.length === 0) bad.push(e.textContent.trim().slice(0, 40) + ' @' + Math.round(q.bottom - r.top));
      if (e.scrollWidth > e.clientWidth + 2 && e.children.length === 0 && e.tagName !== 'DIV') bad.push('HOVERFLOW ' + e.textContent.trim().slice(0, 30)); });
    return s.id + ': ' + (bad.length ? bad.join(' | ') : 'ok'); }));
  console.log(issues.join('\n'));
  const secs = await p.$$('section');
  for (let i = 0; i < secs.length; i++) await secs[i].screenshot({ path: path.join(out, String(i + 1).padStart(2, '0') + '-' + ids[i] + '.png') });
  if (!only) await p.pdf({ path: path.join(out, 'deck.pdf'), width: '1920px', height: '1080px', printBackground: true });
  await b.close();
})();
