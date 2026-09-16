# API

Base URL di sviluppo: `http://127.0.0.1:8787`. Tutte le risposte sono JSON.
Gli errori hanno forma `{ "error": "codice", "message": "descrizione" }`.

Gli importi esposti sono in **Robux** (decimali ammessi: il cashback può valere
mezzo Robux). Internamente tutto è in milli-Robux interi.

## App del giocatore

| Metodo | Rotta | Descrizione |
|---|---|---|
| `POST` | `/v1/auth/start` | `{username}` → codice da incollare nella bio Roblox |
| `POST` | `/v1/auth/confirm` | `{challengeId}` → `{user, token}` |
| `POST` | `/v1/auth/logout` | revoca il token corrente |
| `GET` | `/v1/me` | profilo collegato |
| `GET` | `/v1/games` | catalogo dei giochi partner e relativa percentuale |
| `POST` | `/v1/games/:id/launch` | crea la sessione tracciata → `{deepLink, webLink, token}` |
| `GET` | `/v1/wallet` | saldi: disponibile, in maturazione, in pagamento |
| `GET` | `/v1/wallet/activity` | movimenti di cashback |
| `GET` | `/v1/payouts` | le tue richieste di riscatto |
| `POST` | `/v1/payouts` | `{amountRobux, method, destination}` |
| `POST` | `/v1/payouts/:id/cancel` | annulla una richiesta non ancora eseguita |

Autenticazione: `Authorization: Bearer <token di sessione>`.

## Server di gioco

Autenticazione: `Authorization: Bearer <keyId>.<secret>` (SDK Luau) **oppure**
firma HMAC (integrazioni server-to-server, vedi sotto).

| Metodo | Rotta | Descrizione |
|---|---|---|
| `GET` | `/v1/game/config` | percentuale di cashback e stato del gioco |
| `POST` | `/v1/game/session/attribute` | `{robloxUserId, launchToken?, jobId?}` |
| `POST` | `/v1/game/session/heartbeat` | `{sessionId}` |
| `POST` | `/v1/game/session/end` | `{sessionId}` |
| `POST` | `/v1/game/purchase` | `{receiptId, robloxUserId, productId, robuxSpent, productName?, purchasedAt?}` |

`POST /v1/game/purchase` è idempotente sulla coppia `(gioco, receiptId)`: la
seconda chiamata risponde `200` con `duplicate: true` e non paga nulla.

Risposta tipica:

```json
{
  "duplicate": false,
  "purchaseId": "pur_1f3c…",
  "status": "awarded",
  "cashbackRobux": 40,
  "availableFrom": 1790000000000
}
```

`status` vale `awarded` (cashback maturato), `review` (in revisione manuale),
`unattributed` (nessuna sessione: traffico organico) o `reversed` (bloccato).

### Firma HMAC

Per chi integra da un proprio backend invece che dall'SDK Luau:

```
X-Cashback-Key:       <keyId>
X-Cashback-Timestamp: <epoch ms>
X-Cashback-Nonce:     <stringa casuale, monouso>
X-Cashback-Signature: hex(hmac_sha256(secret, "<timestamp>.<nonce>.<METHOD>.<path>.<sha256(body)>"))
```

Finestra accettata: 5 minuti. Il nonce non è riutilizzabile.

## Back office

Autenticazione: header `X-Admin-Token`.

| Metodo | Rotta | Descrizione |
|---|---|---|
| `POST` | `/v1/admin/partners` | crea un partner |
| `POST` | `/v1/admin/partners/:id/games` | registra un gioco |
| `POST` | `/v1/admin/games/:id/keys` | genera una chiave e revoca la precedente |
| `POST` | `/v1/admin/settle` | sblocca i cashback usciti dall'hold |
| `POST` | `/v1/admin/purchases/:id/reverse` | storna un acquisto |
| `GET` | `/v1/admin/payouts?state=requested` | coda dei riscatti |
| `POST` | `/v1/admin/payouts/:id/approve` | approva |
| `POST` | `/v1/admin/payouts/:id/fulfill` | registra il pagamento eseguito |
| `POST` | `/v1/admin/payouts/:id/reject` | rifiuta e sblocca il saldo |
| `GET` | `/v1/admin/ledger/trial-balance` | bilancio di verifica |
| `GET` | `/v1/admin/stats` | metriche di programma |
