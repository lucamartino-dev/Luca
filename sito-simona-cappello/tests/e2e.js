// Test completo del sito: link, menu, modulo, immagini, layout, errori.
// Uso: node tests/e2e.js [cartella]   (predefinita: site)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require(require.resolve('playwright', { paths: ['/opt/node22/lib/node_modules'] }));

const ROOT = path.resolve(__dirname, '..', process.argv[2] || 'site');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

const results = [];
function check(name, ok, detail = '') { results.push({ name, ok, detail }); }

(async () => {
  await new Promise(r => server.listen(0, r));
  const BASE = `http://127.0.0.1:${server.address().port}/`;
  const pages = fs.readdirSync(ROOT).filter(f => f.endsWith('.html')).sort();
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  for (const vp of [{ name: 'desktop', width: 1366, height: 900 }, { name: 'smartphone', width: 390, height: 844 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    const errors = [];
    const failed = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.url().startsWith(BASE) && r.status() >= 400) failed.push(`${r.status()} ${r.url().replace(BASE, '')}`); });
    page.on('requestfailed', r => { if (r.url().startsWith(BASE)) failed.push(`fallita ${r.url().replace(BASE, '')}`); });

    // 1. Ogni pagina: carica, un solo h1, nessun errore, immagini caricate, niente scorrimento laterale
    for (const f of pages) {
      errors.length = 0; failed.length = 0;
      const resp = await page.goto(BASE + f, { waitUntil: 'networkidle' });
      check(`[${vp.name}] ${f} si apre`, resp.status() === 200, resp.status());
      const h1 = await page.locator('main h1').count();
      check(`[${vp.name}] ${f} ha un solo titolo principale`, h1 === 1, `h1: ${h1}`);
      const title = await page.title();
      check(`[${vp.name}] ${f} ha il titolo della scheda`, title.length > 5, title);
      await page.evaluate(async () => { for (const img of document.images) { img.loading = 'eager'; } window.scrollTo(0, document.body.scrollHeight); await new Promise(r => setTimeout(r, 400)); });
      await page.waitForLoadState('networkidle');
      const broken = await page.evaluate(() => [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute('src')));
      check(`[${vp.name}] ${f} immagini caricate`, broken.length === 0, broken.join(', '));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      check(`[${vp.name}] ${f} senza scorrimento laterale`, overflow <= 0, `${overflow}px`);
      const fonts = await page.evaluate(async () => { await document.fonts.ready; return ['Playfair Display', 'Lato'].map(n => document.fonts.check(`16px "${n}"`)); });
      check(`[${vp.name}] ${f} caratteri caricati`, fonts.every(Boolean), JSON.stringify(fonts));
      check(`[${vp.name}] ${f} nessun errore nella console`, errors.length === 0, errors.join(' | '));
      check(`[${vp.name}] ${f} nessuna risorsa mancante`, failed.length === 0, failed.join(', '));
    }

    // 2. Menu principale: ogni voce porta alla pagina giusta
    await page.goto(BASE + 'index.html');
    const navItems = await page.$$eval('header nav.main a, details.mnav a', as => [...new Set(as.map(a => a.getAttribute('href')))]);
    for (const href of navItems) {
      await page.goto(BASE + 'index.html');
      if (vp.name === 'smartphone') {
        await page.click('details.mnav summary');
        await page.click(`details.mnav a[href="${href}"]`);
      } else {
        await page.click(`header nav.main a[href="${href}"]`);
      }
      await page.waitForLoadState('load');
      const url = page.url().replace(BASE, '');
      check(`[${vp.name}] menu: "${href}" apre la pagina giusta`, url === href, url);
      const current = await page.$eval(`header nav.main a[href="${href}"], details.mnav a[href="${href}"]`, a => a.getAttribute('aria-current')).catch(() => null);
      check(`[${vp.name}] menu: "${href}" evidenziata come pagina attiva`, current === 'page', current);
    }

    // 3. Pulsante "Prenota" sempre visibile
    await page.goto(BASE + 'index.html');
    const cta = vp.name === 'smartphone' ? '.float-cta .btn' : 'header .btn';
    check(`[${vp.name}] pulsante Prenota visibile`, await page.locator(cta).first().isVisible());

    // 4. Modulo contatti: validazione e messaggio di anteprima
    await page.goto(BASE + 'contatti.html');
    await page.click('#contact-form button[type=submit]');
    let msg = await page.textContent('#form-status');
    check(`[${vp.name}] modulo vuoto: avviso campi mancanti`, /servono nome/.test(msg), msg);
    await page.fill('#f-name', 'Prova');
    await page.fill('#f-contact', 'prova@example.com');
    await page.check('#f-privacy');
    await page.click('#contact-form button[type=submit]');
    msg = await page.textContent('#form-status');
    check(`[${vp.name}] modulo compilato: conferma`, /Grazie/.test(msg), msg);

    // 5. Domande frequenti: si aprono
    await page.goto(BASE + 'domande-frequenti.html');
    const second = page.locator('.faq details').nth(1);
    await second.locator('summary').click();
    check(`[${vp.name}] FAQ: la domanda si apre`, await second.evaluate(d => d.open));

    await ctx.close();
  }

  // 6. Tutti i link interni e le ancore esistono
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const links = new Set();
  for (const f of pages) {
    await page.goto(BASE + f);
    const hrefs = await page.$$eval('a[href]', as => as.map(a => a.getAttribute('href')));
    hrefs.filter(h => !/^(https?:|mailto:|tel:)/.test(h)).forEach(h => links.add(`${f} -> ${h}`));
  }
  for (const l of links) {
    const [from, href] = l.split(' -> ');
    const [file, anchor] = href.split('#');
    const target = file || from;
    const exists = fs.existsSync(path.join(ROOT, target));
    let anchorOk = true;
    if (exists && anchor) {
      await page.goto(BASE + target);
      anchorOk = (await page.locator(`[id="${anchor}"]`).count()) > 0;
    }
    check(`link ${l}`, exists && anchorOk, exists ? 'ancora mancante' : 'pagina mancante');
  }
  // 7. Link esterni ben formati
  const ext = new Set();
  for (const f of pages) {
    await page.goto(BASE + f);
    (await page.$$eval('a[href^="http"]', as => as.map(a => a.href))).forEach(h => ext.add(h));
  }
  for (const h of ext) check(`link esterno ${h}`, /^https:\/\/(www\.miodottore\.it|wa\.me|www\.google\.com|www\.movibus\.it)\//.test(h));

  await browser.close();
  server.close();

  const bad = results.filter(r => !r.ok);
  console.log(`\nTest eseguiti: ${results.length}  superati: ${results.length - bad.length}  falliti: ${bad.length}\n`);
  for (const r of bad) console.log(`FALLITO  ${r.name}  ${r.detail}`);
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
