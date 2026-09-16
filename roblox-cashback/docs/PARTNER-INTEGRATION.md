# Integrazione per gli studi partner

Tempo richiesto: circa 20 minuti. Non tocchiamo la tua logica di gioco: avvolgiamo
soltanto `ProcessReceipt`.

## 1. Ricevi le credenziali

Ti mandiamo `gameId`, `keyId` e `secret`. Il segreto si vede una volta sola.

## 2. Registra il segreto in Roblox

Creator Dashboard → la tua esperienza → **Secrets** → nuovo secret:

- nome: `robuxback`
- valore: il segreto che ti abbiamo mandato
- dominio: `api.robuxback.example`

Così il segreto non sta nel codice del gioco, non finisce nei log e non è
leggibile da chi apre il posto in Studio.

## 3. Abilita le richieste HTTP

Game Settings → Security → **Allow HTTP Requests**.

## 4. Installa l'SDK

Copia `packages/roblox-sdk/src/Robuxback` in `ServerScriptService` (o usa Rojo
con il `default.project.json` incluso), poi in uno Script server:

```lua
local MarketplaceService = game:GetService("MarketplaceService")
local Robuxback = require(game:GetService("ServerScriptService").Robuxback)

Robuxback.start({
    baseUrl = "https://api.robuxback.example",
    keyId = "key_xxxxxxxx",
    secretName = "robuxback",
})
Robuxback.trackGamePassPurchases() -- solo se vendi anche gamepass

MarketplaceService.ProcessReceipt = Robuxback.wrapProcessReceipt(function(receiptInfo)
    -- la tua logica esistente, invariata
    return Enum.ProductPurchaseDecision.PurchaseGranted
end)
```

`wrapProcessReceipt` segnala l'acquisto **solo** dopo che la tua logica ha
restituito `PurchaseGranted`. Se la consegna fallisce, non paghiamo cashback.

## 5. Mostra il cashback in gioco (facoltativo, ma rende)

```lua
Robuxback.onAttributed:Connect(function(player, session)
    -- es. badge "cashback 10% attivo" nella UI del negozio
    print(player.Name, "ha il", session.cashbackPercent .. "% di cashback attivo")
end)
```

Sapere che il 10% torna indietro alza la conversione nel negozio: è il motivo
per cui il programma conviene anche a te.

## Cosa succede se la nostra API è giù

L'SDK mette le segnalazioni in coda e ritenta con backoff. Alla chiusura del
server quello che resta viene salvato in un DataStore e ripreso da un server
successivo. Nessuna chiamata blocca la consegna del prodotto al giocatore: gli
acquisti nel tuo gioco funzionano comunque.

## Cosa ti chiediamo per contratto

- Commissione **in Robux** (group payout mensile), calcolata sugli acquisti
  attribuiti che ti mandiamo nel report di riconciliazione.
- Segnalazione dei rimborsi entro 7 giorni, così storniamo prima che il cashback
  diventi riscattabile.
- Diritto di confrontare i tuoi dati di vendita con i nostri su un campione.

## Verifica dell'integrazione (checklist)

L'SDK Luau non è coperto dai test automatici del repo: Roblox non si esegue in
CI. Prima di andare live, in un posto di test:

1. apri il gioco dall'app Robuxback e controlla che nei log compaia
   `[Robuxback] <player> attribuito` (con `verbose = true`);
2. compra un prodotto di prova e verifica che `GET /v1/wallet` mostri il 10%;
3. ripeti lo stesso acquisto forzando un errore nel tuo `ProcessReceipt`:
   il cashback **non** deve comparire;
4. spegni la rete verso la nostra API (dominio sbagliato) e controlla che il
   prodotto venga consegnato lo stesso e la segnalazione resti in coda;
5. entra nel gioco **senza** passare dall'app: l'acquisto deve risultare
   `unattributed` lato nostro.
