# Architettura

```
  ┌───────────────┐   1. apri gioco        ┌──────────────────┐
  │  App / Web    │ ─────────────────────▶ │  API Robuxback   │
  │  (giocatore)  │ ◀───────────────────── │  Node + SQLite   │
  └───────┬───────┘   deep link + token    └────────┬─────────┘
          │                                          ▲
          │ 2. roblox://placeId=..&launchData=token   │ 4. acquisto firmato
          ▼                                          │    (idempotente)
  ┌───────────────┐   3. attribuzione        ┌────────┴─────────┐
  │  App Roblox   │ ───────────────────────▶ │  Gioco partner   │
  │  (giocatore)  │                          │  + SDK Luau      │
  └───────────────┘                          └──────────────────┘
```

1. Il giocatore apre il gioco **dalla nostra app**. Creiamo un *launch intent*
   con un token monouso e lo mettiamo nel deep link.
2. Roblox apre il gioco e consegna il token al server della partita come
   `Player:GetJoinData().LaunchData`.
3. L'SDK lo riscatta sulla nostra API: nasce una **sessione attribuita**.
4. Ogni acquisto (`ProcessReceipt`) viene segnalato. Se cade dentro una sessione
   attribuita, matura il cashback; altrimenti è traffico organico e non si paga.

## Componenti

| Cartella | Cosa c'è |
|---|---|
| `packages/api` | backend: attribuzione, ledger, risk engine, payout, back office |
| `packages/web` | app del giocatore (HTML/CSS/JS, nessun framework, servita dall'API) |
| `packages/roblox-sdk` | ModuleScript Luau da integrare nei giochi partner |

Nessuna dipendenza npm: solo la standard library di Node 22 (`node:sqlite`,
`node:http`, `node:crypto`, `node:test`). Meno superficie da aggiornare, zero
supply chain da sorvegliare per un servizio che tocca denaro.

## Attribuzione

Due percorsi, in ordine di affidabilità:

1. **launch token** (`source = launch_token`): il token viaggia nel deep link.
   Verifichiamo che l'utente Roblox che entra sia lo stesso che ha generato il
   link; se non lo è, la richiesta viene rifiutata e finisce in `risk_events`.
2. **intent recente** (`source = recent_intent`): se il `LaunchData` non arriva
   (succede su alcune piattaforme e nei client web), accettiamo un intent creato
   dallo stesso utente per lo stesso gioco negli ultimi 30 minuti.

La sessione dura 4 ore e si rinnova con gli heartbeat dell'SDK. Un acquisto fuori
sessione viene salvato come `unattributed`: serve a misurare quanto stiamo
perdendo in attribuzione, e non genera né commissione né cashback.

## Contabilità

Partita doppia in **milli-Robux** (1 R$ = 1000 mrbx), così il 10% di 5 R$ non si
perde nell'arrotondamento. Ogni transazione deve bilanciare, altrimenti viene
rifiutata: `GET /v1/admin/ledger/trial-balance` lo verifica su tutto il libro.

Piano dei conti:

| Conto | Natura | Significato |
|---|---|---|
| `user:<id>:pending` | passività | cashback maturato, ancora in hold |
| `user:<id>:available` | passività | cashback riscattabile |
| `user:<id>:reserved` | passività | cashback bloccato da una richiesta di payout |
| `partner:<id>:receivable` | attività | commissioni che il partner ci deve |
| `platform:revenue` | ricavo | margine (commissione meno cashback) |
| `platform:payout_float` | attività | Robux usciti per pagare i giocatori |

Ciclo di vita di un acquisto da 400 R$ (cashback 10%, commissione 25%):

```
accrual     dare  partner:receivable  100 R$
            avere user:pending         40 R$
            avere platform:revenue     60 R$

settlement  dare  user:pending         40 R$      (dopo 7 giorni di hold)
            avere user:available       40 R$

payout      dare  user:available       40 R$      (richiesta)
            avere user:reserved        40 R$

esecuzione  dare  user:reserved        40 R$
            avere platform:payout_float 40 R$
```

Lo storno (`POST /v1/admin/purchases/:id/reverse`) ribalta la scrittura di
accrual finché il cashback è in hold. Dopo lo sblocco il recupero non è
automatico: il caso passa dal supporto, per scelta, perché stornare un saldo che
l'utente vede già come suo è una decisione, non un'operazione contabile.

## Sicurezza

- **Server di gioco → API**: bearer token `<keyId>.<secret>`, con il segreto
  custodito nei Secrets di Roblox (non leggibile dal codice del gioco, non
  stampabile nei log). Le chiavi si ruotano da back office e la vecchia muore
  subito.
- **Server-to-server (partner con backend proprio)**: firma HMAC-SHA256 su
  `timestamp.nonce.METHOD.path.sha256(body)`, con finestra di 5 minuti e nonce
  monouso contro i replay. Copre anche l'integrità del corpo.
- **App → API**: token di sessione opaco, salvato solo come hash SHA-256.
- **Collegamento account**: codice nella bio Roblox, nessuna credenziale.
- **Idempotenza**: `UNIQUE (game_id, receipt_id)`. Roblox ritenta i receipt finché
  non vengono confermati: senza questo vincolo pagheremmo lo stesso acquisto più
  volte.
