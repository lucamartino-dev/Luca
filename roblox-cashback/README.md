# Robuxback

Cashback del 10% sui Robux spesi nei giochi Roblox partner, quando il giocatore
apre il gioco dalla nostra app.

Backend, app del giocatore e SDK Luau per i giochi partner. Nessuna dipendenza
esterna: solo Node 22 e la sua standard library.

## Leggi prima questo

Roblox impone tre vincoli che decidono il prodotto:

1. **nessuna API vede la spesa di un utente nei giochi altrui**, quindi il
   cashback copre solo i giochi che integrano il nostro SDK: ogni gioco è un
   accordo commerciale, non un'integrazione tecnica unilaterale;
2. **i Robux non si trasferiscono fra utenti**: si pagano con group payout
   (14 giorni di iscrizione al gruppo) o con gift card;
3. **comprare Robux costa ~10 volte quello che un creatore incassa vendendoli**,
   quindi la commissione dei partner va incassata in Robux, non in euro,
   altrimenti si perde su ogni acquisto.

Il dettaglio, con i numeri e le domande legali ancora aperte (minori, GDPR,
approvazione di Roblox), sta in [docs/COMPLIANCE.md](docs/COMPLIANCE.md) e
[docs/ECONOMICS.md](docs/ECONOMICS.md). Vanno lette prima di parlare con un
partner.

## Come funziona

```
app → deep link con token → gioco Roblox → SDK attribuisce la sessione
                                              ↓
                          acquisto (ProcessReceipt) → API → cashback 10%
                                              ↓
                      hold 7 giorni → saldo riscattabile → group payout
```

Chi entra nel gioco senza passare dall'app non genera né cashback né commissione:
l'acquisto viene comunque registrato come `unattributed`, per misurare quanta
attribuzione stiamo perdendo.

## Prova in due minuti

```bash
cd packages/api
RBX_MODE=mock RBX_ADMIN_TOKEN=dev RBX_HOLD_DAYS=0 npm start
# in un altro terminale
RBX_ADMIN_TOKEN=dev node scripts/demo.js   # giro completo: account, partita, acquisto, saldo
```

`RBX_MODE=mock` non chiama roblox.com: gli account Roblox sono simulati.
L'app del giocatore è su <http://127.0.0.1:8787>.

```bash
npm test    # 35 test: contabilità, attribuzione, frodi, firme, payout
```

## Struttura

| Cartella | Contenuto |
|---|---|
| `packages/api` | backend: attribuzione, ledger in partita doppia, risk engine, payout |
| `packages/web` | app del giocatore, servita dall'API |
| `packages/roblox-sdk` | ModuleScript Luau per i giochi partner |
| `docs` | architettura, API, integrazione partner, compliance, economia, runbook |

## Documentazione

- [Architettura](docs/ARCHITECTURE.md) — attribuzione, piano dei conti, sicurezza
- [API](docs/API.md) — tutte le rotte
- [Integrazione partner](docs/PARTNER-INTEGRATION.md) — 20 minuti lato studio
- [Compliance](docs/COMPLIANCE.md) — vincoli Roblox e questioni legali aperte
- [Economia](docs/ECONOMICS.md) — perché la commissione si incassa in Robux
- [Runbook](docs/OPERATIONS.md) — payout, storni, incidenti, cosa manca per la produzione

## Stato

Riferimento funzionante e testato end-to-end, non un sistema pronto a incassare.
Quello che manca per la produzione (segreti in KMS, Postgres, back office con
interfaccia) è elencato in fondo al [runbook](docs/OPERATIONS.md). L'SDK Luau non
è coperto dai test automatici perché Roblox non gira in CI: la checklist di
verifica manuale è in fondo a [PARTNER-INTEGRATION.md](docs/PARTNER-INTEGRATION.md).
