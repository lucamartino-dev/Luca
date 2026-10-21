// Test dell'anteprima a pagina unica: ogni link interno deve mostrare la vista giusta.
// Uso: node tests/preview.js <cartella_anteprima>
const path = require('path');
const { chromium } = require(require.resolve('playwright', { paths: ['/opt/node22/lib/node_modules'] }));

const http = require('http');
const fs = require('fs');
const DIR = path.resolve(process.argv[2]);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const file = path.join(DIR, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
  if (!file.startsWith(DIR) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
let URL;
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok, detail });

async function visible(page) {
  return page.evaluate(() => {
    const v = document.querySelector('[data-page]:not([hidden])');
    const h1 = v && v.querySelector('h1');
    return { page: v && v.getAttribute('data-page'), h1: h1 && h1.offsetParent !== null ? h1.textContent.trim() : null, count: document.querySelectorAll('[data-page]:not([hidden])').length };
  });
}

(async () => {
  await new Promise(r => server.listen(0, r));
  URL = `http://127.0.0.1:${server.address().port}/_test.html`;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const vp of [{ name: 'desktop', width: 1366, height: 900 }, { name: 'smartphone', width: 390, height: 844 }]) {
    const page = await (await browser.newContext({ viewport: vp })).newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(URL);
    let v = await visible(page);
    check(`[${vp.name}] all'apertura si vede la home`, v.page === 'index.html' && v.count === 1, JSON.stringify(v));

    // Menu
    const nav = await page.$$eval('header nav.main a', as => as.map(a => a.getAttribute('href')));
    for (const href of nav) {
      if (vp.name === 'smartphone') { await page.click('details.mnav summary'); await page.click(`details.mnav a[href="${href}"]`); }
      else await page.click(`header nav.main a[href="${href}"]`);
      v = await visible(page);
      check(`[${vp.name}] menu "${href}" mostra la pagina giusta`, v.page === href && !!v.h1 && v.count === 1, JSON.stringify(v));
      const cur = await page.$eval(`header nav.main a[href="${href}"]`, a => a.getAttribute('aria-current'));
      check(`[${vp.name}] menu "${href}" evidenziato`, cur === 'page', cur);
      if (vp.name === 'smartphone') check(`[${vp.name}] menu "${href}" si richiude`, !(await page.$eval('details.mnav', d => d.open)));
    }

    // Ogni link interno di ogni vista
    const views = await page.$$eval('[data-page]', ds => ds.map(d => d.getAttribute('data-page')));
    for (const from of views) {
      await page.evaluate(n => { const a = document.createElement('a'); a.href = n; a.setAttribute('href', n); document.body.appendChild(a); a.click(); a.remove(); }, from);
      const hrefs = await page.$$eval('[data-page]:not([hidden]) a[href]', as => as.map(a => a.getAttribute('href')).filter(h => !/^(https?:|mailto:|tel:)/.test(h)));
      for (const href of [...new Set(hrefs)]) {
        await page.evaluate(n => { const a = document.createElement('a'); a.setAttribute('href', n); document.body.appendChild(a); a.click(); a.remove(); }, from);
        await page.locator(`[data-page]:not([hidden]) a[href="${href}"]`).first().evaluate(a => a.click());
        v = await visible(page);
        const [file, anchor] = href.split('#');
        const expected = file || from;
        let ok = v.page === expected && v.count === 1;
        if (ok && anchor) ok = await page.evaluate(id => !!document.querySelector('[data-page]:not([hidden]) [id="' + id + '"]'), anchor);
        check(`[${vp.name}] ${from}: link "${href}"`, ok, JSON.stringify(v));
      }
    }
    // Modulo nell'anteprima
    await page.evaluate(() => { const a = document.createElement('a'); a.setAttribute('href', 'contatti.html'); document.body.appendChild(a); a.click(); a.remove(); });
    await page.fill('#f-name', 'Prova'); await page.fill('#f-contact', 'prova@example.com'); await page.check('#f-privacy');
    await page.click('#contact-form button[type=submit]');
    v = await visible(page);
    const msg = await page.textContent('#form-status');
    check(`[${vp.name}] modulo: resta sulla pagina e conferma`, v.page === 'contatti.html' && /Grazie/.test(msg), msg);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    check(`[${vp.name}] senza scorrimento laterale`, overflow <= 0, overflow);
    check(`[${vp.name}] nessun errore`, errors.length === 0, errors.join(' | '));
  }
  await browser.close();
  server.close();
  const bad = results.filter(r => !r.ok);
  console.log(`\nAnteprima: test ${results.length}, superati ${results.length - bad.length}, falliti ${bad.length}`);
  bad.forEach(r => console.log('FALLITO', r.name, r.detail));
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
