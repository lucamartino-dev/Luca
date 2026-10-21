#!/usr/bin/env python3
"""Crea l'anteprima per Claude: tutte le pagine del sito in un'unica pagina.

L'anteprima di Claude non permette di passare da un file HTML all'altro, quindi
qui ogni pagina diventa una "vista" e un piccolo script la mostra al clic sui link.
Il sito vero (cartella site/) resta diviso in pagine.

Uso: python3 tools/preview.py <cartella_di_uscita>
"""
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"

ROUTER = """<script>
(function () {
  var views = document.querySelectorAll('[data-page]');
  function show(name, anchor) {
    var target = document.querySelector('[data-page="' + name + '"]') || document.querySelector('[data-page="index.html"]');
    views.forEach(function (v) { v.hidden = v !== target; });
    document.title = target.getAttribute('data-title');
    document.querySelectorAll('header nav a[href], details.mnav a[href]').forEach(function (a) {
      if (a.getAttribute('href') === target.getAttribute('data-page')) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.querySelectorAll('details.mnav').forEach(function (d) { d.open = false; });
    var el = anchor && target.querySelector('[id="' + anchor + '"]');
    if (el) el.scrollIntoView(); else window.scrollTo(0, 0);
    try { history.replaceState(null, '', '#' + target.getAttribute('data-page').replace('.html', '')); } catch (e) {}
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (/^(https?:|mailto:|tel:)/.test(href)) return;
    var m = href.match(/^([\\w-]+\\.html)?(?:#([\\w-]+))?$/);
    if (!m) return;
    e.preventDefault();
    if (m[1]) { show(m[1], m[2]); return; }
    var current = document.querySelector('[data-page]:not([hidden])');
    var el = m[2] && current.querySelector('[id="' + m[2] + '"]');
    if (el) el.scrollIntoView();
  });
  var start = (location.hash || '').slice(1);
  show(start ? start + '.html' : 'index.html');
})();
</script>"""


def main(out):
    out = Path(out)
    if out.exists():
        shutil.rmtree(out)
    shutil.copytree(SITE / "assets", out / "assets")

    pages = sorted(p.name for p in SITE.glob("*.html"))
    pages.remove("index.html")
    pages.insert(0, "index.html")

    views = []
    for name in pages:
        html = (SITE / name).read_text(encoding="utf-8")
        title = re.search(r"<title>(.*?)</title>", html, re.S).group(1)
        main_inner = re.search(r'<main id="contenuto">(.*?)</main>', html, re.S).group(1)
        hidden = "" if name == "index.html" else " hidden"
        views.append(f'<div data-page="{name}" data-title="{title}"{hidden}>{main_inner}</div>')

    index = (SITE / "index.html").read_text(encoding="utf-8")
    head = re.search(r"<head>(.*?)</head>", index, re.S).group(1)
    head = re.sub(r'<meta charset[^>]*>\s*|<meta name="viewport"[^>]*>\s*', "", head)
    body = re.search(r"<body>(.*?)</body>", index, re.S).group(1)
    body = re.sub(r'(<main id="contenuto">).*?(</main>)', lambda m: m.group(1) + "\n".join(views) + m.group(2), body, flags=re.S)
    body += "\n" + ROUTER

    (out / "index.html").write_text(head.strip() + "\n" + body, encoding="utf-8")
    # Versione completa, solo per i test automatici
    (out / "_test.html").write_text(
        '<!doctype html><html lang="it"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1">' + head + "</head><body>" + body + "</body></html>",
        encoding="utf-8",
    )
    print(f"Anteprima con {len(pages)} pagine in {out}")


if __name__ == "__main__":
    main(sys.argv[1])
