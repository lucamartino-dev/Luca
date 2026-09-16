# Luca — Skills & agenti operativi

Repository degli agenti (skill) operativi.

## sae-investor-search
Agente per trovare investitori in Italia potenzialmente interessati al progetto
**SAE** (Skylabs — consulenza AI enterprise + piattaforma agentica Universe) e
recuperarne le email dei decision maker.

- `sae-investor-search/SKILL.md` — workflow end-to-end (mappa investitori →
  filtro di fit con SAE → enrichment Lusha → dedup su Google Sheet → report).
- `sae-investor-search/references/investor-icp.md` — ICP + mappa del panorama
  investitori italiano + query web.
- `sae-investor-search/references/lusha-filters.md` — filtri Lusha per i
  decision maker dei fondi.
- `sae-investor-search/references/sae-onepager.md` — SAE in sintesi per fit e
  outreach.

Lancio: chiedi in chat "cerca investitori per SAE" (o equivalente).

## roblox-cashback
Programma di cashback per Roblox: chi apre un gioco partner dalla nostra app
riceve il 10% dei Robux che spende dentro quel gioco.

- `roblox-cashback/packages/api` — backend (attribuzione, ledger in partita
  doppia, risk engine, payout), senza dipendenze esterne.
- `roblox-cashback/packages/web` — app del giocatore.
- `roblox-cashback/packages/roblox-sdk` — ModuleScript Luau per i giochi partner.
- `roblox-cashback/docs` — architettura, API, integrazione partner, vincoli
  Roblox e conti economici.

Prova: `cd roblox-cashback/packages/api && RBX_MODE=mock npm start`
