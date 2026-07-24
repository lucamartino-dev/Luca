---
name: sae-investor-search
description: >
  Trova investitori in Italia potenzialmente interessati al progetto SAE
  (Skylabs, consulenza AI enterprise + piattaforma agentica Universe) e ne
  recupera le email dei decision maker (Partner, Managing Partner, General
  Partner, Principal, Investment Manager/Director, founder del fondo). Combina
  una mappa curata del panorama investitori italiano (VC, corporate VC, family
  office, business angel network, growth/PE tech, fondi pubblici), un refresh
  via web search e l'enrichment Lusha per email/telefono, con dedup e storico su
  Google Sheet. Filtra per fit di tesi con SAE (AI agentica, enterprise SaaS
  B2B, deep tech, fintech/FS, data platform) ed esclude chi investe solo in
  consumer/biotech/real estate non pertinenti. Usa SEMPRE questa skill quando
  Luca chiede di "cercare investitori", "trovare VC/business angel per SAE o
  Skylabs", "email degli investitori", "chi puo investire nel progetto SAE",
  "lista investitori AI in Italia", "fundraising SAE" o "aggiornare il foglio
  investitori", anche se non nomina Lusha o il Google Sheet.
---

# SAE Investor Search (Investitori per Skylabs)

Skill operativa per costruire e mantenere la lista degli investitori italiani
che potrebbero finanziare **SAE** (Skylabs: consulenza AI enterprise con la
piattaforma agentica proprietaria Universe) e per recuperarne le **email** dei
decision maker. Obiettivo: un elenco azionabile per il fundraising, con contatto
verificato e una riga di tesi che spiega perche quell'investitore e in target.

Pipeline: mappa investitori (curata + web search) -> filtro di fit con SAE ->
enrichment contatti via Lusha (email + telefono) -> dedup e storico su Google
Sheet -> report a Luca.

Prima di eseguire, leggi `references/investor-icp.md` (chi e in target e mappa
del panorama italiano), `references/lusha-filters.md` (valori reali dei filtri
per trovare i decision maker dei fondi) e `references/sae-onepager.md` (cos'e
SAE, per giudicare il fit e per l'eventuale outreach).

## Esecuzione a comando singolo

Quando Luca lancia "cerca investitori per SAE" (o equivalente) NON fare domande
di rito: usa i default ICP qui sotto e gira il flusso end-to-end fino al foglio
aggiornato e al report. Se Luca mette parametri nel messaggio (tipo di
investitore, ticket, stage, geografia allargata, dimensione batch), quelli
prevalgono sui default.

Chiedi conferma solo in tre casi: (1) un connettore necessario manca; (2) stai
per consumare crediti Lusha e i residui sono sotto la soglia di sicurezza (vedi
"Budget"); (3) Luca chiede "TUTTI" gli investitori e il batch stimato supera il
cap di reveal previsto per il run — in quel caso proponi di procedere per lotti.

## Cosa fa e cosa NON fa

FA:
- Costruisce/aggiorna la mappa degli investitori italiani in target per SAE,
  partendo dalla lista curata in `references/investor-icp.md` e allargando con
  web search (nuovi fondi, nuovi veicoli AI, round recenti, dry powder fresco).
- Filtra ogni investitore per fit di tesi con SAE prima di spendere reveal.
- Recupera per i fondi in target i decision maker giusti e ne rivela email e
  telefono via Lusha.
- Mantiene un Google Sheet master con dedup, tesi di fit e data inserimento.
- Riporta a Luca la lista con email pronta all'outreach.

NON FA:
- NON inventa fondi, persone o email: ogni contatto viene da Lusha o da una
  fonte pubblica verificabile citata. Se non c'e conferma, il contatto non entra.
- NON include investitori fuori tesi (solo consumer, solo biotech wet-lab, solo
  real estate, solo crypto puro) salvo richiesta esplicita di Luca.
- NON ri-rivela chi e gia nel master (evita di bruciare reveal due volte).
- NON usa LinkedIn per automazioni: l'URL LinkedIn e solo dato anagrafico nel
  foglio, a uso di Luca.
- NON parte da sola su schedule (vale la stessa logica di it-leaders-prospecting:
  per l'unattended serve uno script esterno).

## Parametri di default (ICP investitori)

Salvo diversa indicazione di Luca:

- Geografia: Italia. Includi anche fondi paneuropei/esteri con team o ufficio in
  Italia che investono su startup italiane (marcali "estero con presenza IT").
  Allarga a EU/DACH/UK solo se Luca lo chiede.
- Stage/veicolo target per SAE: SAE e una societa di consulenza AI enterprise
  gia a ricavi con piattaforma SaaS (Universe). Gli investitori piu coerenti
  sono growth/late VC, private equity tech, search fund/family office e corporate
  VC industriali/FS; i VC early-stage AI restano in lista se investono anche in
  round di crescita o in profit-generating. Segna lo stage nel foglio.
- Tipi di investitore: VC (AI/deep tech/enterprise SaaS), corporate VC, family
  office e holding industriali, business angel network e club deal, growth
  equity / PE tech, fondi pubblici/istituzionali (CDP Venture Capital e simili).
- Ruoli da rivelare (decision maker del fondo): Founding/Managing/General
  Partner, Partner, Principal, Investment Director/Manager, Head of Investments,
  Managing Director, e per family office/CVC il C-level che decide gli
  investimenti. Gli Associate/Analyst sono opzionali (utili come primo contatto).
- Filtro di fit: includi solo investitori la cui tesi copre AI applicata
  enterprise, software B2B/SaaS, deep tech, fintech/financial services, data &
  infrastructure. Vedi la classificazione in `references/investor-icp.md`.
- Batch: max 25 nuovi contatti rivelati per run (controllo spesa Lusha).
  Modificabile su richiesta. Se Luca chiede "tutti", procedi a lotti da 25 e
  chiedi conferma tra un lotto e l'altro.

## Prerequisiti (controlla a inizio run)

1. Connettori: Lusha e Google Drive attivi. Se manca Lusha, puoi comunque
   produrre la mappa investitori con le email pubbliche reperibili via web
   search, segnalando a Luca che senza Lusha le email dirette dei partner
   saranno parziali. Se manca Google Drive, consegna la lista in tabella nel
   report e proponi di creare il foglio quando il connettore torna.
2. Strumenti Lusha: i nomi dei tool possono variare per versione del connettore.
   Caricali con `tool_search` (es. query "Lusha") e individua l'equivalente di:
   ricerca contatti/decision maker, ricerca aziende, risoluzione filtri, reveal/
   enrichment del contatto, e usage/credito. Nelle versioni note esistono sia i
   nomi `prospecting_contact_search` / `prospecting_contact_enrich` /
   `prospecting_company_search` / `account_usage`, sia `decision_makers_search` /
   `recommendations_contacts` / `recommendations_companies`. Usa quelli presenti.
3. Budget Lusha: controlla l'usage PRIMA di rivelare. L'enrichment consuma un
   reveal credit per contatto. Se i residui sono sotto la soglia di sicurezza
   (default: meno del doppio del batch previsto), avvisa Luca e proponi di
   ridurre il batch.

## Workflow

### Step 1 - Costruisci la mappa investitori
Parti dalla lista curata in `references/investor-icp.md`. Poi allarga con web
search mirata (query in quella reference): nuovi fondi AI/deep-tech italiani,
round di crescita recenti su startup AI B2B in Italia (chi ha fatto da lead e in
target), nuovi veicoli di CDP/corporate/family office. Per ogni investitore
raccogli: nome del fondo, tipo, tesi/settori, stage, ticket indicativo, sede,
sito, fonte. Punta a una rosa ampia prima di filtrare.

### Step 2 - Filtro di fit con SAE (gating, no reveal)
Per ogni investitore, valuta il fit con SAE usando `references/investor-icp.md` e
`references/sae-onepager.md`. Tieni solo chi ha tesi coerente (AI enterprise,
SaaS B2B, deep tech, fintech/FS, data platform, agentic/automation). Scrivi in
una riga PERCHE e in target (es. "ha guidato round su AI SaaS B2B; ticket
growth; fit con Universe/FS"). Chi e fuori tesi va marcato PASS e non si rivela.
Questo step non consuma crediti.

### Step 3 - Trova i decision maker (anteprima Lusha, no reveal)
Per i fondi in target, usa la ricerca contatti Lusha con i filtri in
`references/lusha-filters.md` (ruoli investment + country IT + eventualmente
nome azienda del fondo). La ricerca restituisce un'ANTEPRIMA che NON consuma
reveal. In parallelo, per i fondi piccoli/angel dove Lusha e povero, cerca via
web l'email pubblica del partner o del canale contatti del fondo (spesso
pubblica): registrala come fonte "web" (verificabile) invece di spendere reveal.

### Step 4 - Dedup vs master (prima di rivelare)
Individua il master sheet (default: file Drive "Skylabs - SAE Investor Search").
Se non esiste, crealo con l'header (vedi Schema). Leggi il contenuto attuale.
Scarta dai candidati da rivelare chi e gia presente (dedup su email, oppure
Nome+Cognome+Fondo). Non ri-rivelare e non cambiare la loro data inserimento.

### Step 5 - Rivela email e telefono (reveal Lusha)
Sui soli contatti nuovi selezionati, fino al cap del batch, chiama l'enrichment
Lusha per ottenere email e telefono. Dai priorita all'email aziendale del fondo.
Se un contatto non ha email dopo il reveal, tienilo con il dato disponibile e
segna "email non disponibile"; ripiega sull'email pubblica del fondo se esiste.

### Step 6 - Aggiorna il Google Sheet master (read-merge-write)
1. Leggi il master (`read_file_content` o `download_file_content`).
2. Dedup come sopra; aggiungi solo righe nuove con "Data inserimento" = oggi
   (YYYY-MM-DD, usa la data di sessione).
3. Riscrivi l'intero foglio con storico + nuove righe (gli strumenti Drive non
   fanno append in-place: read-merge-write).
4. Ordina per Data inserimento decrescente (nuovi in cima).

### Step 7 - Report a Luca
Output sintetico, stile CEO:
- N. investitori in mappa / N. in target dopo filtro fit / N. contatti nuovi
  rivelati oggi / N. duplicati esclusi / crediti Lusha usati e residui.
- Tabella dei nuovi contatti: Fondo, Tipo, Nome, Ruolo, Email, Fit (1 riga).
- Link al Google Sheet aggiornato.
- Eventuali fondi in target ancora senza contatto (da lavorare nel prossimo run).

## Schema Google Sheet (colonne, in ordine)

| Colonna | Contenuto |
|---|---|
| Data inserimento | Data del primo inserimento (YYYY-MM-DD) |
| Fondo | Nome del fondo / investitore |
| Tipo | VC / Corporate VC / Family office / Angel network / Growth-PE / Pubblico |
| Stage | Stage tipico (seed / early / growth / late / PE) |
| Ticket | Range di ticket indicativo (se noto) |
| Tesi/Settori | Focus dichiarato dell'investitore |
| Fit SAE | 1 riga: perche e in target per SAE |
| Nome | Nome contatto |
| Cognome | Cognome contatto |
| Ruolo | Job title nel fondo |
| Email | Email (aziendale del fondo di preferenza) |
| Telefono | Telefono / mobile (o "n/d") |
| Sede | Citta / Paese |
| LinkedIn | URL profilo (solo dato anagrafico) |
| Sito | Sito del fondo |
| Fonte email | "Lusha" oppure URL pubblico |
| Stato | vuoto / da contattare / contattato (a uso di Luca) |
| Note | Campo libero |

## Budget e rate limit

- Controlla l'usage Lusha a inizio run; non rivelare se sotto soglia di sicurezza.
- Default: max 25 nuovi contatti rivelati per run. Adatta se Luca lo chiede.
- Su HTTP 429 (rate limit): fermati, riporta quanti contatti sono stati salvati,
  riprendi nel run successivo.
- Preferisci l'email pubblica del fondo (via web) quando disponibile e affidabile
  per i fondi piccoli/angel: risparmia reveal e spesso il canale e comunque
  quello giusto per un primo contatto istituzionale.

## Note di metodo

- Il fit non e affinita generica: un investitore e in target se la sua tesi
  reale copre cio che SAE E (AI enterprise gia a ricavi, Universe come moat,
  verticali FS/Microsoft). Un fondo solo-consumer o solo-biotech non e in target
  anche se "fa tech". Spiega sempre il perche in una riga.
- Cita sempre la fonte quando l'email arriva dal web. Nessuna email inventata o
  dedotta a pattern (non costruire `nome.cognome@fondo.com` a indovinare):
  o e verificata (Lusha) o e pubblicata (URL), altrimenti resta "email n/d".
- La lista e un punto di partenza per l'outreach di Luca, non una garanzia di
  interesse: la qualifica finale la fa lui.

Riferimenti: `references/investor-icp.md` (chi e in target + mappa Italia + query
web), `references/lusha-filters.md` (filtri reali per i decision maker dei
fondi), `references/sae-onepager.md` (SAE in sintesi per fit e outreach).
