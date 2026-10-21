# Sito Dott.ssa Simona Cappello, Psicologa

Sito statico in HTML e CSS, senza dipendenze. Si pubblica su qualunque hosting (Netlify, Vercel, GitHub Pages, Aruba...).

## Struttura

- `src/pages/` i testi di ogni pagina
- `assets/` stile, script e favicon
- `build.py` assembla le pagine con header, footer e dati di contatto
- `site/` il sito pronto da caricare online (generato, non modificare a mano)

## Come aggiornare

1. Modifica i recapiti in `CONFIG` dentro `build.py` (telefono, WhatsApp, email, P. IVA, dominio).
2. Modifica i testi in `src/pages/`.
3. Lancia `python3 build.py` e carica online la cartella `site/`.

## Test

- `node tests/e2e.js`: prova tutto il sito in un browser vero (desktop e smartphone): pagine, menu, link e ancore, immagini, caratteri, modulo, domande frequenti, scorrimento laterale, errori.
- `python3 tools/preview.py <cartella>` e poi `node tests/preview.js <cartella>`: crea e prova l'anteprima a pagina unica usata su Claude.

## Da completare

- [x] Telefono, WhatsApp, email, P. IVA
- [x] Foto della dottoressa e dello studio
- [x] Tariffe, durata, colloqui online, orari, accesso allo studio
- [x] Caratteri tipografici ospitati sul sito (niente Google Fonts esterni)
- [x] Modulo di contatto pronto per Netlify Forms
- [ ] Acquisto del dominio e pubblicazione (vedi GUIDA-PUBBLICAZIONE.md)
- [ ] Privacy policy definitiva
- [ ] Scheda Google Business Profile e Google Search Console
