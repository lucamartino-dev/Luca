#!/usr/bin/env python3
"""Genera il sito statico in site/ a partire da src/pages/*.html.

Uso:  python3 build.py
I dati di contatto stanno tutti in CONFIG: modificali qui e rilancia lo script.
"""
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src" / "pages"
OUT = ROOT / "site"

CONFIG = {
    "site_url": "https://www.simonacappellopsicologa.it",  # da confermare quando acquisti il dominio
    "name": "Dott.ssa Simona Cappello",
    "role": "Psicologa",
    "phone": "+39 347 051 5781",
    "whatsapp": "393470515781",
    "email": "simonacappello@gmail.com",
    "miodottore": "https://www.miodottore.it/profilo/simona-cappello",
    "address": "Via Cornaredo 17",
    "cap": "20006",
    "city": "Pregnana Milanese",
    "province": "MI",
    "albo": "Ordine degli Psicologi della Lombardia n. 29185",
    "piva": "13929220963",
    "hours": "Lunedì-venerdì, 9-18, anche in pausa pranzo",
    "maps": "https://www.google.com/maps/search/?api=1&query=Via+Cornaredo+17+20006+Pregnana+Milanese",
    "towns": ["Pregnana Milanese", "Cornaredo", "Rho", "Bareggio", "Vanzago", "Arluno"],
}

NAV = [
    ("index.html", "Home"),
    ("chi-sono.html", "Chi sono"),
    ("di-cosa-mi-occupo.html", "Di cosa mi occupo"),
    ("approccio.html", "Il mio approccio"),
    ("studio.html", "Lo studio"),
    ("contatti.html", "Contatti"),
]

_S = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'
ICONS = {
    "person": f'<svg {_S}><circle cx="12" cy="8" r="3.5"/><path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5"/></svg>',
    "couple": f'<svg {_S}><circle cx="8.5" cy="8" r="3"/><circle cx="16" cy="9" r="2.6"/><path d="M3 19.5c.9-3.2 3-4.9 5.5-4.9s4.6 1.7 5.5 4.9"/><path d="M14.6 14.9c.5-.2 1-.3 1.4-.3 2.2 0 4 1.5 4.8 4.4"/></svg>',
    "family": f'<svg {_S}><circle cx="9" cy="7" r="3"/><circle cx="17" cy="11" r="2"/><path d="M3.5 19.5c.8-3.6 2.9-5.6 5.5-5.6s4.7 2 5.5 5.6"/><path d="M14.8 19.5c.4-2.2 1.2-3.6 2.2-3.6s1.8 1.4 2.2 3.6"/></svg>',
    "sprout": f'<svg {_S}><path d="M12 21v-8"/><path d="M12 13c0-4 3-6.5 7-6.5 0 4-3 6.5-7 6.5z"/><path d="M12 15.5c0-3-2.5-5.2-6-5.2 0 3 2.5 5.2 6 5.2z"/></svg>',
    "heart": f'<svg {_S}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
    "compass": f'<svg {_S}><circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg>',
    "pin": f'<svg {_S}><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>',
    "chat": f'<svg {_S}><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12z"/></svg>',
    "calendar": f'<svg {_S}><rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/></svg>',
}

MONOGRAM = (
    '<svg class="mono" viewBox="0 0 48 48" aria-hidden="true">'
    '<path d="M8 44V22a16 16 0 0 1 32 0v22" fill="none" stroke="#A8958A" stroke-width="1.3"/>'
    '<text x="24" y="34" text-anchor="middle" font-family="Playfair Display, Georgia, serif" font-size="15" font-style="italic" fill="#5F514C">SC</text>'
    "</svg>"
)


def todo(text):
    return f'<span class="todo">{text}</span>'


def whatsapp_url():
    return f"https://wa.me/{CONFIG['whatsapp']}" if CONFIG["whatsapp"] else "contatti.html"


def phone_text():
    return CONFIG["phone"] or todo("numero da inserire")


def email_text():
    return CONFIG["email"] or todo("email da inserire")


def nav_items(current, cls=""):
    out = []
    for href, label in NAV:
        cur = ' aria-current="page"' if href == current else ""
        out.append(f'<li><a href="{href}"{cur}>{label}</a></li>')
    return "\n          ".join(out)


def header(current):
    return f"""<a class="skip" href="#contenuto">Vai al contenuto</a>
<header class="top">
  <div class="wrap">
    <a class="brand" href="index.html">{MONOGRAM}<span class="brand-text"><strong>{CONFIG['name']}</strong><span class="role">{CONFIG['role']}</span></span></a>
    <div class="head-right">
      <nav class="main" aria-label="Menu principale">
        <ul>
          {nav_items(current)}
        </ul>
      </nav>
      <details class="mnav">
        <summary>Menu</summary>
        <ul>
          {nav_items(current)}
        </ul>
      </details>
      <a class="btn small" href="{CONFIG['miodottore']}" target="_blank" rel="noopener">Prenota un colloquio</a>
    </div>
  </div>
</header>"""


def final_cta():
    return f"""<section class="final" aria-labelledby="cta-title">
  <div class="wrap">
    <p class="eyebrow">Primo colloquio</p>
    <h2 id="cta-title">Prendersi uno spazio per sé può essere il primo passo</h2>
    <p>Se senti il bisogno di un luogo in cui fermarti, comprenderti e affrontare con maggiore chiarezza ciò che stai vivendo, puoi contattarmi per un primo colloquio.</p>
    <div class="actions">
      <a class="btn" href="{CONFIG['miodottore']}" target="_blank" rel="noopener">{ICONS['calendar']}Prenota un colloquio</a>
      <a class="btn secondary" href="{whatsapp_url()}" target="_blank" rel="noopener">{ICONS['chat']}Scrivimi su WhatsApp</a>
      <a class="btn secondary" href="{CONFIG['miodottore']}" target="_blank" rel="noopener">Vai al profilo MioDottore</a>
    </div>
  </div>
</section>"""


def footer():
    return f"""<footer class="site">
  <div class="wrap">
    <div class="col">
      <h2>{CONFIG['name']}</h2>
      <span>{CONFIG['role']} a {CONFIG['city']}</span>
      <span>{CONFIG['address']}, {CONFIG['cap']} {CONFIG['city']} ({CONFIG['province']})</span>
      <span>{CONFIG['hours']}, su appuntamento</span>
    </div>
    <div class="col">
      <p class="label">Contatti</p>
      <span>Telefono / WhatsApp: {phone_text()}</span>
      <span>Email: {email_text()}</span>
      <a href="{CONFIG['miodottore']}" target="_blank" rel="noopener">Profilo MioDottore</a>
    </div>
    <div class="col">
      <p class="label">Il sito</p>
      <ul>
        <li><a href="chi-sono.html">Chi sono</a></li>
        <li><a href="di-cosa-mi-occupo.html">Di cosa mi occupo</a></li>
        <li><a href="approccio.html">Il mio approccio</a></li>
        <li><a href="domande-frequenti.html">Domande frequenti</a></li>
      </ul>
    </div>
    <div class="col">
      <p class="label">Note professionali</p>
      <span>Iscritta all'{CONFIG['albo']}</span>
      <span>P. IVA {CONFIG['piva'] or todo('da inserire')}</span>
    </div>
    <div class="legal">
      <span>© <span data-year>2026</span> {CONFIG['name']}, {CONFIG['role']}</span>
      <nav aria-label="Note legali">
        <a href="note-legali.html#privacy">Privacy Policy</a>
        <a href="note-legali.html#cookie">Cookie Policy</a>
        <a href="note-legali.html#note-legali">Note legali</a>
      </nav>
    </div>
  </div>
</footer>
<div class="float-cta">
  <a class="btn" href="{CONFIG['miodottore']}" target="_blank" rel="noopener">Prenota</a>
  <a class="btn secondary" href="{whatsapp_url()}" target="_blank" rel="noopener">{ICONS['chat']}WhatsApp</a>
</div>"""


def business_jsonld():
    data = {
        "@context": "https://schema.org",
        "@type": "MedicalBusiness",
        "name": f"{CONFIG['name']}, {CONFIG['role']}",
        "description": "Psicologa a orientamento cognitivo post-razionalista e coach certificata. Supporto individuale, di coppia, alla genitorialità, adolescenti e neo-mamme.",
        "url": CONFIG["site_url"] + "/",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": CONFIG["address"],
            "postalCode": CONFIG["cap"],
            "addressLocality": CONFIG["city"],
            "addressRegion": CONFIG["province"],
            "addressCountry": "IT",
        },
        "areaServed": [{"@type": "City", "name": t} for t in CONFIG["towns"]],
        "sameAs": [CONFIG["miodottore"]],
        "openingHours": "Mo-Fr 09:00-18:00",
        "founder": {"@type": "Person", "name": "Simona Cappello", "jobTitle": "Psicologa"},
    }
    if CONFIG["phone"]:
        data["telephone"] = CONFIG["phone"]
    if CONFIG["email"]:
        data["email"] = CONFIG["email"]
    return data


def layout(meta, body, path):
    url = CONFIG["site_url"] + "/" + ("" if path == "index.html" else path)
    ld = [business_jsonld()] + meta.get("jsonld", [])
    ld_html = "\n".join(
        f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>' for x in ld
    )
    return f"""<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{meta['title']}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="{meta['description']}">
{'<meta name="robots" content="noindex">' if meta.get('noindex') else ''}
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:locale" content="it_IT">
<meta property="og:title" content="{meta['title']}">
<meta property="og:description" content="{meta['description']}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{CONFIG['site_url']}/assets/simona-cappello.jpg">
<meta name="theme-color" content="#FAF7F4">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="preload" href="assets/fonts/playfair-display-normal-4.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/fonts.css">
<link rel="stylesheet" href="assets/style.css">
{ld_html}
</head>
<body>
{header(meta.get('nav', path))}
<main id="contenuto">
{body}
</main>
{footer()}
<script src="assets/main.js" defer></script>
</body>
</html>
"""


def render(text):
    text = text.replace("{{final_cta}}", final_cta())
    text = re.sub(r"\{\{icon:(\w+)\}\}", lambda m: ICONS[m.group(1)], text)
    text = re.sub(r"\{\{todo:([^}]*)\}\}", lambda m: todo(m.group(1)), text)
    text = text.replace("{{whatsapp_url}}", whatsapp_url())
    text = text.replace("{{phone}}", phone_text())
    text = text.replace("{{email}}", email_text())
    for k, v in CONFIG.items():
        if isinstance(v, str):
            text = text.replace("{{" + k + "}}", v)
    return text


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(ROOT / "assets", OUT / "assets")

    pages = []
    for src in sorted(SRC.glob("*.html")):
        raw = src.read_text(encoding="utf-8")
        m = re.match(r"\s*<!--META\s*(\{.*?\})\s*-->\s*", raw, re.S)
        meta = json.loads(m.group(1))
        body = render(raw[m.end():])
        (OUT / src.name).write_text(layout(meta, body, src.name), encoding="utf-8")
        if not meta.get("noindex"):
            pages.append(src.name)

    base = CONFIG["site_url"]
    urls = "\n".join(
        f"  <url><loc>{base}/{'' if p == 'index.html' else p}</loc></url>" for p in pages
    )
    (OUT / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}\n</urlset>\n',
        encoding="utf-8",
    )
    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {base}/sitemap.xml\n", encoding="utf-8")
    print(f"Generate {len(pages)} pagine in {OUT}")


if __name__ == "__main__":
    main()
