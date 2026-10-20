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

## Da completare prima della pubblicazione

Nel sito le parti da completare sono evidenziate in rosa.

- [ ] Telefono, WhatsApp, email, P. IVA (in `build.py`)
- [ ] Foto professionale per la home e la pagina Chi sono
- [ ] Foto dello studio (stanza, dettaglio, sala d'attesa)
- [ ] Verifica del numero di iscrizione all'Albo
- [ ] Tariffe e durata delle sedute
- [ ] Colloqui online: sì o no
- [ ] Università e anni dei titoli, nome del centro di tirocinio
- [ ] Come arrivare: parcheggio, treno, accessibilità
- [ ] Privacy e cookie policy definitive
- [ ] Collegare il modulo di contatto a un servizio di invio (es. Formspree o Netlify Forms)
- [ ] Acquistare il dominio e aggiornare `site_url`
- [ ] Creare o collegare la scheda Google Business Profile al sito
