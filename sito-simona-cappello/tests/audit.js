// Audit di qualità: accessibilità (axe-core, WCAG 2.1 AA), Google, tastiera, zoom, peso.
// Uso: AXE=/percorso/axe.min.js node tests/audit.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require(require.resolve('playwright', { paths: ['/opt/node22/lib/node_modules'] }));

const ROOT = path.resolve(__dirname, '..', 'site');
const AXE = process.env.AXE;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

const issues = [];
const note = (sev, page, msg) => issues.push({ sev, page, msg });

(async () => {
  await new Promise(r => server.listen(0, r));
  const BASE = `http://127.0.0.1:${server.address().port}/`;
  const pages = fs.readdirSync(ROOT).filter(f => f.endsWith('.html')).sort();
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const titles = {}, descs = {};

  for (const vp of [{ name: 'desktop', width: 1366, height: 900 }, { name: 'smartphone', width: 390, height: 844 }, { name: 'zoom 200%', width: 683, height: 450 }]) {
    const page = await (await browser.newContext({ viewport: { width: vp.width, height: vp.height } })).newPage();
    for (const f of pages) {
      await page.goto(BASE + f, { waitUntil: 'networkidle' });

      // Accessibilità automatica
      if (AXE && vp.name !== 'zoom 200%') {
        await page.addScriptTag({ path: AXE });
        const r = await page.evaluate(async () => {
          // apre tutte le domande frequenti e i menu, per controllare anche il testo nascosto
          document.querySelectorAll('details').forEach(d => (d.open = true));
          const res = await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] });
          return res.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 3).map(n => n.target.join(' ')) }));
        });
        r.forEach(v => note(v.impact === 'critical' || v.impact === 'serious' ? 'ALTA' : 'MEDIA', `${f} [${vp.name}]`, `${v.id}: ${v.help} -> ${v.nodes.join(' , ')}`));
        await page.reload({ waitUntil: 'networkidle' });
      }

      // Bersagli da toccare troppo piccoli su smartphone (WCAG 2.5.8: almeno 24px)
      if (vp.name === 'smartphone') {
        const small = await page.evaluate(() => [...document.querySelectorAll('a, button, summary, input, select, textarea')]
          .filter(e => e.offsetParent !== null && !e.closest('p, li, .crumbs, figcaption, label'))
          .map(e => ({ t: (e.textContent || e.name || '').trim().slice(0, 30), r: e.getBoundingClientRect() }))
          .filter(x => x.r.width > 0 && (x.r.height < 24 || x.r.width < 24)).map(x => `${x.t} (${Math.round(x.r.width)}x${Math.round(x.r.height)})`));
        small.forEach(s => note('MEDIA', `${f} [smartphone]`, `bersaglio piccolo da toccare: ${s}`));
      }

      // Zoom 200%: niente scorrimento laterale
      const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (ov > 0) note('ALTA', `${f} [${vp.name}]`, `scorrimento laterale di ${ov}px`);

      if (vp.name === 'desktop') {
        // Tastiera: il primo tasto Tab porta a "Vai al contenuto", il focus è visibile
        await page.keyboard.press('Tab');
        const first = await page.evaluate(() => ({ t: document.activeElement.textContent.trim(), o: getComputedStyle(document.activeElement).outlineStyle, top: document.activeElement.getBoundingClientRect().top }));
        if (!/Vai al contenuto/.test(first.t) || first.top < 0) note('MEDIA', f, `primo Tab: "${first.t}" non visibile o non è il salto al contenuto`);
        await page.keyboard.press('Tab');
        const sec = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
        if (sec === 'none') note('ALTA', f, 'focus da tastiera non visibile');

        // Google
        const seo = await page.evaluate(() => ({
          title: document.title,
          desc: (document.querySelector('meta[name=description]') || {}).content || '',
          canonical: !!document.querySelector('link[rel=canonical]'),
          lang: document.documentElement.lang,
          noindex: !!document.querySelector('meta[name=robots][content*=noindex]'),
          ids: [...document.querySelectorAll('[id]')].map(e => e.id),
          imgsNoAlt: [...document.images].filter(i => !i.hasAttribute('alt')).length,
          headings: [...document.querySelectorAll('main h1, main h2, main h3')].map(h => +h.tagName[1]),
          ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => { try { JSON.parse(s.textContent); return true; } catch (e) { return false; } }),
        }));
        if (seo.lang !== 'it') note('ALTA', f, 'lingua della pagina non impostata');
        if (!seo.canonical) note('MEDIA', f, 'manca il link canonico');
        if (seo.title.length > 70) note('BASSA', f, `titolo lungo per Google (${seo.title.length} caratteri): ${seo.title}`);
        if (seo.desc.length < 70 || seo.desc.length > 165) note('BASSA', f, `descrizione per Google di ${seo.desc.length} caratteri (ideale 70-160)`);
        if (!seo.noindex) { (titles[seo.title] = titles[seo.title] || []).push(f); (descs[seo.desc] = descs[seo.desc] || []).push(f); }
        const dup = seo.ids.filter((x, i) => seo.ids.indexOf(x) !== i);
        if (dup.length) note('ALTA', f, `id duplicati: ${[...new Set(dup)].join(', ')}`);
        if (seo.imgsNoAlt) note('ALTA', f, `${seo.imgsNoAlt} immagini senza testo alternativo`);
        for (let i = 1; i < seo.headings.length; i++) if (seo.headings[i] - seo.headings[i - 1] > 1) { note('MEDIA', f, `salto di livello nei titoli: h${seo.headings[i - 1]} -> h${seo.headings[i]}`); break; }
        if (seo.ld.some(x => !x)) note('ALTA', f, 'dati strutturati non validi');
      }
    }
  }
  Object.entries(titles).filter(([, v]) => v.length > 1).forEach(([t, v]) => note('MEDIA', v.join(', '), `titolo uguale: ${t}`));
  Object.entries(descs).filter(([, v]) => v.length > 1).forEach(([d, v]) => note('MEDIA', v.join(', '), 'descrizione uguale'));

  // Peso delle pagine
  const size = p => fs.statSync(path.join(ROOT, p)).size;
  const imgs = fs.readdirSync(path.join(ROOT, 'assets')).filter(f => f.endsWith('.jpg'));
  imgs.forEach(i => { const kb = size('assets/' + i) / 1024; if (kb > 250) note('BASSA', i, `immagine pesante: ${Math.round(kb)} KB`); });

  await browser.close();
  server.close();
  const order = { ALTA: 0, MEDIA: 1, BASSA: 2 };
  issues.sort((a, b) => order[a.sev] - order[b.sev]);
  // raggruppa i problemi identici su più pagine
  const groups = {};
  issues.forEach(i => { const k = i.sev + '|' + i.msg; (groups[k] = groups[k] || []).push(i.page); });
  console.log(`Problemi trovati: ${Object.keys(groups).length}`);
  Object.entries(groups).forEach(([k, ps]) => { const [s, m] = k.split('|'); console.log(`[${s}] ${m}\n        su: ${ps.slice(0, 4).join('; ')}${ps.length > 4 ? ` e altre ${ps.length - 4}` : ''}`); });
  process.exit(Object.keys(groups).some(k => k.startsWith('ALTA')) ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
