# Runbook operativo

## Routine

| Quando | Cosa | Come |
|---|---|---|
| continuo | sblocco dei cashback maturati | automatico ogni 60 s; forzabile con `POST /v1/admin/settle` |
| giornaliero | coda dei riscatti | `GET /v1/admin/payouts?state=requested` → approva → esegui → `fulfill` |
| giornaliero | eventi di rischio | `SELECT * FROM risk_events WHERE created_at > …` |
| settimanale | bilancio di verifica | `GET /v1/admin/ledger/trial-balance`, `balanced` deve essere `true` |
| mensile | riconciliazione partner | confronta `attributedGrossRobux` con i loro dati di vendita, emetti la commissione |
| mensile | backup | copia del file SQLite (WAL incluso) fuori dalla macchina |

## Eseguire un payout

1. `GET /v1/admin/payouts?state=requested`
2. Controlli: l'utente non ha eventi di rischio aperti; l'account Roblox è nel
   gruppo da almeno 14 giorni (requisito Roblox per i group payout).
3. `POST /v1/admin/payouts/:id/approve`
4. Esegui il group payout dal gruppo Robuxback (o emetti la gift card).
5. `POST /v1/admin/payouts/:id/fulfill` con `externalRef` = riferimento del
   pagamento. Solo a questo punto il saldo riservato lascia il libro.

Se il pagamento fallisce: `POST /v1/admin/payouts/:id/reject` con la motivazione.
Il saldo torna disponibile all'utente, senza perdite contabili.

## Rimborso o chargeback

`POST /v1/admin/purchases/:id/reverse` con `{"reason": "chargeback"}`.

- cashback ancora in hold → storno completo, contabilità a zero;
- cashback già sbloccato → la risposta contiene `needsManualRecovery: true`:
  l'acquisto risulta stornato ma il saldo resta all'utente. Decisione umana:
  compensazione sui cashback futuri o perdita accettata. È voluto: togliere
  Robux da un saldo che l'utente vede già come suo non può essere automatico.

## Rotazione delle chiavi di gioco

`POST /v1/admin/games/:id/keys` genera la nuova chiave e revoca la vecchia
**immediatamente**. Concorda la finestra con il partner: fra la generazione e
l'aggiornamento del secret in Roblox, le loro segnalazioni falliscono (l'SDK le
accoda e le ritenta, quindi non si perdono, ma la coda ha un limite di tentativi).

## Incidenti

**L'API è giù.** Gli SDK accodano e ritentano; alla chiusura dei server di gioco
le segnalazioni finiscono in un DataStore e vengono riprese dopo. Perdita attesa:
nulla, entro i tentativi configurati. Verifica dopo il ripristino che
`unattributedPurchases` non sia schizzato.

**Sospetta frode su un partner.** Metti il gioco in pausa
(`UPDATE games SET status = 'paused'`): smette di generare cashback ma gli
acquisti continuano a essere registrati per l'analisi.

**Un utente farma cashback.** `UPDATE users SET status = 'review'` manda in
revisione tutti i suoi acquisti successivi con hold esteso; `suspended` blocca
tutto, payout compresi.

## Configurazione

| Variabile | Default | Cosa cambia |
|---|---|---|
| `RBX_CASHBACK_BPS` | 1000 | cashback al giocatore (1000 = 10%) |
| `RBX_COMMISSION_BPS` | 2500 | commissione di default al partner |
| `RBX_HOLD_DAYS` | 7 | giorni prima che il cashback sia riscattabile |
| `RBX_EXTENDED_HOLD_DAYS` | 21 | hold per account nuovi o acquisti in revisione |
| `RBX_LAUNCH_TTL_MIN` | 30 | validità del launch token |
| `RBX_SESSION_TTL_MIN` | 240 | durata della sessione attribuita |
| `RBX_MAX_DAILY_CASHBACK` | 5000 | tetto giornaliero per utente, in Robux |
| `RBX_PAYOUT_MIN` | 100 | minimo riscattabile |
| `RBX_ADMIN_TOKEN` | casuale a ogni avvio | token del back office |
| `RBX_MODE` | `live` | `mock` non chiama roblox.com (sviluppo e test) |

## Cosa manca prima della produzione

Elencato apertamente, perché il repo è un riferimento funzionante, non un
sistema pronto a incassare:

- **Segreti in chiaro.** `game_keys.secret` sta nel database. In produzione va
  in un KMS, con in tabella solo un riferimento.
- **SQLite su singolo nodo.** Regge il pilota, non la scala: il ledger è scritto
  in transazioni SQL standard e migra su Postgres senza cambiare la logica.
- **Rate limit in memoria.** Serve Redis appena ci sono più processi.
- **Back office solo via API.** Niente interfaccia: le operazioni si fanno con
  `curl` o con un client REST.
- **Nessuna verifica indipendente degli acquisti.** Ci fidiamo del server del
  partner: Roblox non offre modo di verificare dall'esterno. La difesa è
  contrattuale e statistica (riconciliazione, anomalie), non tecnica.
