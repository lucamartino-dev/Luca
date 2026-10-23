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
    "role": "Psicologa e coach",
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
    "hours": "Dal lunedì al venerdì, dalle 9 alle 18, anche in pausa pranzo",
    "google_reviews": "https://www.google.com/maps/search/?api=1&query=Dott.ssa+Simona+Cappello+Psicologa",
    "maps": "https://www.google.com/maps/search/?api=1&query=Via+Cornaredo+17+20006+Pregnana+Milanese",
    "towns": ["Pregnana Milanese", "Cornaredo", "Settimo Milanese", "Vighignolo", "Rho", "Bareggio", "Vanzago", "Arluno"],
}

NAV = [
    ("index.html", "Home"),
    ("chi-sono.html", "Chi sono"),
    ("di-cosa-mi-occupo.html", "Di cosa mi occupo"),
    ("approccio.html", "Il mio approccio"),
    ("studio.html", "Lo studio"),
    ("domande-frequenti.html", "Tariffe e FAQ"),
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
    "badge": f'<svg {_S}><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    "star": f'<svg {_S}><path d="M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z"/></svg>',
    "video": f'<svg {_S}><rect x="3.5" y="6.5" width="12" height="11" rx="2"/><path d="M15.5 10.5l5-3v9l-5-3"/></svg>',
    "receipt": f'<svg {_S}><path d="M6 3.5h12v17l-3-2-3 2-3-2-3 2z"/><path d="M9 8.5h6M9 12h6"/></svg>',
    "circles": f'<svg {_S}><circle cx="9" cy="12" r="5.5"/><circle cx="15" cy="12" r="5.5"/></svg>',
    "bowl": f'<svg {_S}><path d="M3.5 11h17a8.5 8.5 0 0 1-17 0z"/><path d="M9 7c0-1.5 1-2 1-3.5M13 7c0-1.5 1-2 1-3.5"/></svg>',
    "leaf": f'<svg {_S}><path d="M5 19c0-8 5-14 14-14 0 9-6 14-14 14z"/><path d="M5 19c3-4 6-7 10-9"/></svg>',
    "award": f'<svg {_S}><circle cx="12" cy="9" r="5.5"/><path d="M8.5 13.5L7 21l5-2.5 5 2.5-1.5-7.5"/></svg>',
    "info": f'<svg {_S}><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/></svg>',
}

# Gli ambiti di intervento: una pagina ciascuno
SERVICES = [
    ("supporto-individuale.html", "person", "Supporto individuale", "Per momenti di difficoltà emotiva, ansia, stress, senso di blocco, cambiamenti di vita, fragilità relazionali o bisogno di maggiore consapevolezza."),
    ("sostegno-coppia.html", "couple", "Sostegno alla coppia", "Uno spazio per comprendere dinamiche, fatiche comunicative, distanza emotiva e momenti di crisi all'interno della relazione."),
    ("sostegno-genitorialita.html", "family", "Sostegno alla genitorialità", "Per accompagnare i genitori nella comprensione dei bisogni dei figli e delle difficoltà educative o relazionali."),
    ("adolescenti.html", "sprout", "Adolescenti", "Uno spazio di ascolto dedicato ai ragazzi, per affrontare fragilità, vissuti emotivi, difficoltà relazionali e momenti delicati della crescita."),
    ("neo-mamme-maternita.html", "heart", "Neo-mamme e maternità", "Per accogliere dubbi, cambiamenti, fatiche e vissuti emotivi legati alla maternità e alla ridefinizione di sé."),
    ("malattia-cronica.html", "leaf", "Convivere con una malattia cronica", "Uno spazio per chi convive con una malattia cronica, e per chi gli sta accanto, per dare voce a ciò che la malattia porta con sé."),
    ("sessualita-identita.html", "circles", "Sessualità, identità e orientamento", "Uno spazio sicuro e senza giudizio per parlare di sessualità, desiderio, orientamento sessuale e identità di genere."),
    ("rapporto-con-il-cibo.html", "bowl", "Il rapporto con il cibo", "Per chi sente che il cibo è diventato fonte di fatica, senso di colpa o preoccupazione: fame emotiva, abbuffate, diete continue, immagine corporea."),
    ("coaching-orientamento.html", "compass", "Coaching e crescita professionale", "Percorsi mirati per chi desidera fare chiarezza in una fase di cambiamento personale o professionale, o vive lo stress del lavoro."),
]

# Incontri e workshop già realizzati (anche in studio, in piccoli gruppi)
EVENTS = [
    ("Burnout", "Capirlo e superarlo", "Quando il lavoro consuma le energie: segnali, cause e strategie per ritrovare equilibrio.", "Aziende e professionisti", True, "salvia"),
    ("Ansia", "Conoscerla per gestirla", "Cos'è l'ansia, perché arriva e come imparare ad ascoltarla senza esserne travolti.", "Adulti e gruppi", False, "sabbia"),
    ("Le emozioni", "Riconoscerle, nominarle, viverle", "Un incontro per imparare a dare un nome a ciò che proviamo e a farne una risorsa.", "Adulti, scuole e associazioni", False, "legno"),
    ("Fame emotiva", "Quando il cibo parla delle emozioni", "Il legame tra cibo, emozioni e corpo, e come costruire un rapporto più sereno con l'alimentazione.", "Adulti e gruppi", False, "sabbia"),
    ("Stress e lavoro", "Ritrovare equilibrio", "Pressione, carichi, conciliazione: strumenti concreti per stare meglio al lavoro.", "Aziende e team", False, "legno"),
    ("Diventare mamma", "Il benessere dopo la nascita", "Emozioni, fatiche e cambiamenti dei primi mesi, per non sentirsi sole.", "Neo-mamme con i loro bambini", False, "salvia"),
    ("Crescere con loro", "Adolescenti ed emozioni", "Un incontro per genitori: capire i ragazzi e trovare il modo di stare loro accanto.", "Genitori e scuole", False, "sabbia"),
    ("Il corpo che cresce", "Intimità e scoperta di sé", "La scoperta del corpo, l'intimità, il ciclo: parole semplici e serene per parlarne in famiglia, senza imbarazzo.", "Genitori e bambini", False, "legno"),
    ("Schermi e dispositivi", "Quando diventano una dipendenza", "Smartphone, videogiochi e social: capire quando preoccuparsi e come accompagnare i bambini verso un uso più sereno.", "Genitori e bambini", False, "salvia"),
    ("Cambiare strada", "Affrontare le transizioni di vita", "Cambiare lavoro, città, ruolo: come attraversare il cambiamento senza perdersi.", "Adulti e professionisti", False, "sabbia"),
]

PRICES = [
    ("Colloquio individuale", "70 €", "50 minuti, in studio"),
    ("Colloquio di coppia", "100 €", "60 minuti, in studio"),
    ("Colloquio online", "60 €", "50 minuti, in videochiamata"),
]

MONOGRAM = (
    '<svg class="mono" viewBox="0 0 48 48" aria-hidden="true">'
    '<path d="M8 44V22a16 16 0 0 1 32 0v22" fill="none" stroke="#9A7656" stroke-width="1.3"/>'
    '<text x="24" y="34" text-anchor="middle" font-family="Playfair Display, Georgia, serif" font-size="15" font-style="italic" fill="#4C5F50">SC</text>'
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


def service_cards(exclude=None, with_help=True):
    out = []
    for href, icon, title, text in SERVICES:
        if href == exclude:
            continue
        out.append(
            f'<a class="card" href="{href}"><span class="ico">{ICONS[icon]}</span>'
            f'<h3>{title}</h3><p>{text}</p><span class="go">Scopri di più</span></a>'
        )
    html = "\n      ".join(out)
    if with_help:
        html += (
            '\n    </div>\n    <div class="help-strip"><p><strong>Non sai quale scegliere?</strong> '
            'Non serve saperlo prima: lo capiamo insieme al primo incontro.</p>'
            '<a class="btn secondary" href="contatti.html">Scrivimi due righe</a>'
        )
    return html


def service_chips(exclude):
    items = "".join(
        f'<li><a href="{href}"><span class="ico">{ICONS[icon]}</span>{title}</a></li>'
        for href, icon, title, _ in SERVICES if href != exclude
    )
    return f'<ul class="chips">{items}</ul>'


def posters(limit=None):
    out = []
    for title, sub, text, who, done, tone in EVENTS[:limit]:
        badge = '<span class="badge">Incontro</span>'
        out.append(
            f'<article class="poster {tone}"><div class="poster-top">{badge}</div>'
            f'<h3>{title}</h3><p class="sub">{sub}</p><p class="txt">{text}</p>'
            f'<p class="who">{who}</p><p class="sign">Dott.ssa Simona Cappello</p></article>'
        )
    return "\n      ".join(out)


METHOD = [
    ("heart", "Ogni percorso è diverso", "Non ho un programma uguale per tutti. Partiamo da quello che porti tu, oggi, e costruiamo il percorso su di te, sulla tua storia e su ciò di cui hai bisogno."),
    ("chat", "Siamo in due", "Non parlerai nel vuoto mentre io ascolto in silenzio. È un dialogo vero: ti faccio domande, ti restituisco quello che vedo, ti propongo spunti. E tu puoi sempre dirmi cosa ti serve e cosa no."),
    ("compass", "Decidi tu il ritmo", "Non devi raccontare tutto subito, né partire dall'inizio. Puoi cominciare da quello che senti più urgente: il resto arriverà quando te la sentirai."),
    ("sprout", "Qualcosa da portare con te", "Ogni incontro ha uno scopo: capire meglio cosa sta succedendo e trovare insieme modi nuovi per affrontarlo nella vita di tutti i giorni, anche con strumenti pratici quando servono."),
]


def method_block():
    items = "\n      ".join(f'<li><span class="ico">{ICONS[i]}</span><h3>{t}</h3><p>{d}</p></li>' for i, t, d in METHOD)
    return f'''<ol class="method">
      {items}
    </ol>'''


def prices_block():
    cards = "\n      ".join(
        f'<div class="price"><h3>{t}</h3><p class="amount">{a}</p><p class="meta">{m}</p></div>' for t, a, m in PRICES
    )
    return f"""<div class="prices">
      {cards}
    </div>
    <div class="price-notes">
      <p><strong>Detraibili.</strong> Le prestazioni psicologiche sono spese sanitarie detraibili nella dichiarazione dei redditi, se pagate con metodi tracciabili. Rilascio sempre fattura.</p>
      <p><strong>Pagamento</strong> con bonifico, carta, Satispay o PayPal. È possibile pagare anche in contanti, ma in questo caso la prestazione non è detraibile.</p>
    </div>"""


def trust_strip():
    return f"""<ul class="trust" aria-label="In breve">
        <li>{ICONS['badge']}Iscritta all'Albo degli Psicologi della Lombardia, n. 29185</li>
        <li>{ICONS['star']}<a href="{CONFIG['miodottore']}" target="_blank" rel="noopener">87 recensioni su MioDottore</a></li>
        <li>{ICONS['video']}In studio e online</li>
        <li>{ICONS['receipt']}Prestazioni detraibili</li>
      </ul>"""


def emergency():
    return f"""<p class="emergency">{ICONS['info']}<span><strong>Non è un servizio di emergenza.</strong> Se sei in pericolo o temi per la tua sicurezza o per quella di qualcun altro, chiama subito il <strong>112</strong>.</span></p>"""


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
    <p class="eyebrow">Quando te la senti</p>
    <h2 id="cta-title">Prendersi uno spazio per sé può essere il primo passo</h2>
    <p>Se senti il bisogno di un luogo in cui fermarti, comprenderti e affrontare con maggiore chiarezza ciò che stai vivendo, puoi contattarmi: troveremo insieme il momento giusto per incontrarci.</p>
    <div class="actions">
      <a class="btn" href="{CONFIG['miodottore']}" target="_blank" rel="noopener">{ICONS['calendar']}Prenota su MioDottore</a>
      <a class="btn secondary" href="{whatsapp_url()}" target="_blank" rel="noopener">{ICONS['chat']}Scrivimi su WhatsApp</a>
    </div>
    <p class="small-note">Preferisci parlarne prima? Chiamami o scrivimi al {phone_text()}: rispondo personalmente.</p>
  </div>
</section>"""


def footer():
    return f"""<footer class="site">
  <div class="wrap">
    <div class="col">
      <h2>{CONFIG['name']}</h2>
      <span>{CONFIG['role']}</span>
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
      <p class="label">Di cosa mi occupo</p>
      <ul>
        {"".join(f'<li><a href="{h}">{t}</a></li>' for h, _, t, _ in SERVICES)}
        <li><a href="incontri.html">Incontri e workshop</a></li>
      </ul>
    </div>
    <div class="col">
      <p class="label">Note professionali</p>
      <span>Iscritta all'{CONFIG['albo']}</span>
      <span>P. IVA {CONFIG['piva'] or todo('da inserire')}</span>
    </div>
    <div class="sos">{emergency()}</div>
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
<nav class="float-cta" aria-label="Prenotazione rapida">
  <a class="btn" href="{CONFIG['miodottore']}" target="_blank" rel="noopener">{ICONS['calendar']}Prenota</a>
  <a class="btn secondary" href="{whatsapp_url()}" target="_blank" rel="noopener">{ICONS['chat']}WhatsApp</a>
</nav>"""


def business_jsonld():
    data = {
        "@context": "https://schema.org",
        "@type": "MedicalBusiness",
        "name": f"{CONFIG['name']}, {CONFIG['role']}",
        "description": "Psicologa e coach certificata. Supporto individuale, di coppia, alla genitorialità, adolescenti e neo-mamme.",
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
        "priceRange": "60-100 €",
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
    text = text.replace("{{trust}}", trust_strip())
    text = text.replace("{{prices}}", prices_block())
    text = text.replace("{{method}}", method_block())
    text = text.replace("{{posters}}", posters())
    text = text.replace("{{posters_teaser}}", posters(4))
    text = text.replace("{{emergency}}", emergency())
    text = text.replace("{{service_cards}}", service_cards())
    text = re.sub(r"\{\{other_services:([\w.-]+)\}\}", lambda m: service_chips(m.group(1)), text)
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
