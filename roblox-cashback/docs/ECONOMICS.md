# Economia del programma

Tutti i numeri qui sotto sono ordini di grandezza da riverificare prima di
firmare contratti: Roblox ha cambiato più volte quote e tassi.

## Le due valute

| | Valore di 1 Robux |
|---|---|
| Costo di acquisto al dettaglio (l'utente compra Robux) | ~0,0125 $ (800 R$ ≈ 9,99 $) |
| Valore in uscita per il creatore via DevEx | ~0,0035 $ (100.000 R$ ≈ 350 $) |

Il rapporto è circa **3,5x**, e su una singola vendita diventa **10x** perché
Roblox trattiene anche il 30% sull'acquisto in-game.

## Perché la commissione va incassata in Robux

Prendiamo un acquisto da **100 R$** dentro un gioco partner.

| Voce | Robux | In dollari |
|---|---|---|
| Speso dal giocatore | 100 R$ | ~1,25 $ (costo di acquisto per il giocatore) |
| Trattenuta Roblox (30%) | -30 R$ | |
| Netto al partner | 70 R$ | ~0,245 $ se convertiti in DevEx |

Se il partner ci pagasse **in denaro** una commissione del 25% del lordo
(25 R$), al tasso DevEx ci arriverebbero ~0,0875 $. Per restituire 10 R$ al
giocatore dovremmo comprare Robux al dettaglio: ~0,125 $. **Perderemmo su ogni
singolo acquisto**, prima ancora dei costi operativi.

La conclusione è secca: **il cashback in Robux si finanzia solo con Robux.**
Il partner ci paga la commissione con un group payout in Robux, noi paghiamo i
giocatori con un group payout in Robux. Niente conversione, niente arbitraggio
contro di noi.

## Conto economico per 100 R$ di spesa attribuita

Con i valori di default (`commissionBps` 2500, `cashbackBps` 1000):

| | Robux |
|---|---|
| Commissione incassata dal partner | 25 R$ |
| Cashback dovuto al giocatore | -10 R$ |
| **Margine lordo** | **15 R$** |

Il partner resta con 45 R$ netti su 70 (64%). È un costo di acquisizione:
si giustifica solo se il traffico che portiamo è **incrementale**, cioè
giocatori che senza di noi non avrebbero speso lì. Per questo:

- la commissione si paga **solo** sugli acquisti attribuiti a una sessione
  partita dalla nostra app, mai sul traffico organico (il codice registra gli
  acquisti non attribuiti come `unattributed`, a commissione zero);
- `commissionBps` è per partner: si negozia caso per caso (un gioco maturo che
  ci considera poco incrementale pagherà meno, un gioco in lancio di più);
- il pilota va misurato con un holdout, non con i numeri totali del partner.

## Costo del payout

| Canale | Costo per 10 R$ pagati | Note |
|---|---|---|
| Group payout finanziato dalle commissioni | 10 R$ (già incassati) | canale principale, margine intatto |
| Gift card comprata in euro | ~0,12 € | solo per promozioni e casi eccezionali: è una spesa di marketing, non un canale sostenibile |

Il group payout richiede 14 giorni di appartenenza al gruppo: per questo
l'iscrizione al gruppo Robuxback va proposta al collegamento dell'account, così
il conto alla rovescia parte subito e non blocca il primo riscatto.

## Leve su cui si muove il modello

- **Tasso di attribuzione**: quanti acquisti riusciamo davvero a collegare a una
  nostra sessione. Se il `LaunchData` non passa, il fallback copre solo chi ha
  aperto il gioco dall'app negli ultimi 30 minuti.
- **Storni**: ogni rimborso Roblox mangia margine se il cashback è già stato
  sbloccato. Da qui il periodo di hold di 7 giorni (21 per gli account nuovi).
- **Frode**: account creati in serie per farmare cashback su acquisti finti di
  un partner compiacente. Tetti giornalieri, hold esteso e riconciliazione.
