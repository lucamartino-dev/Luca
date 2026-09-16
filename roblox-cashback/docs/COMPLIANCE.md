# Vincoli Roblox e compliance

Questo è il documento da leggere per primo: determina cosa il prodotto può fare
e cosa no. Il codice è scritto attorno a questi vincoli.

## I tre fatti che vincolano il design

**1. Non esiste un'API che dica quanto un utente spende nei giochi di altri.**
Le API di Roblox (incluso Open Cloud) espongono i dati della *tua* esperienza e
del *tuo* gruppo. Non c'è modo, da fuori, di osservare gli acquisti di un utente
dentro un gioco di terzi. Quindi il cashback non può essere "universale": copre
solo i giochi che integrano il nostro SDK. Ogni partner è un accordo commerciale.

**2. I Robux non si spostano da utente a utente.**
Non esistono trasferimenti diretti fra account. I meccanismi leciti per far
arrivare Robux a una persona sono due:
- **group payout**: un gruppo distribuisce i propri Robux ai membri; Roblox
  richiede che il destinatario sia membro del gruppo **da almeno 14 giorni**;
- **gift card**: si acquistano con denaro reale e si riscattano in Robux.

Tutto il resto (vendere Robux, scambiarli fuori piattaforma, "generatori") è
vietato e fa bannare gli account coinvolti. Il nostro payout usa solo i due
canali sopra.

**3. Comprare Robux costa molto più di quanto valgano quando li incassi.**
Al dettaglio un Robux costa circa 10 volte quello che il creatore ottiene
convertendolo in denaro tramite DevEx. Questa asimmetria non è un dettaglio:
**rende impossibile finanziare in denaro un cashback pagato in Robux**. Vedi
[ECONOMICS.md](ECONOMICS.md): la conseguenza è che i partner devono pagarci la
commissione **in Robux**, non in euro.

## Come ci posizioniamo

- Non siamo un "generatore di Robux gratis". Siamo un programma di affiliazione
  fra sviluppatori: il partner paga una commissione sugli acquisti che gli
  portiamo, e noi ne giriamo una parte al giocatore.
- Non chiediamo mai credenziali Roblox. Il collegamento dell'account avviene
  con un codice da incollare nella propria bio pubblica: non tocchiamo password,
  non serve OAuth, non c'è niente da rubare.
- Non promettiamo Robux "gratis": il cashback matura solo su spesa reale,
  tracciata dal server del gioco partner.
- Comunichiamo chiaramente che non siamo affiliati a Roblox Corporation.

## Cosa va verificato prima di andare in produzione

Queste sono le domande aperte, non risolvibili scrivendo codice:

1. **Approvazione di Roblox.** Un programma che incentiva la spesa con un
   rimborso va presentato a Roblox prima del lancio. Le Community Standards e i
   Terms of Use cambiano; l'interpretazione su incentivi e ricompense off-platform
   va confermata per iscritto, non dedotta.
2. **Minori.** Gran parte dell'utenza Roblox è minorenne. Un programma che
   restituisce valore economico a minori tocca consenso dei genitori, GDPR
   (base giuridica, minimizzazione, età minima), regole su premi e lotterie,
   e norme sulla pubblicità ai minori. Serve parere legale specifico per ogni
   mercato, e con ogni probabilità un'età minima e la verifica del genitore.
3. **Antiriciclaggio e fiscalità.** Il cashback ha valore economico. Vanno
   definiti soglie di segnalazione, limiti annui per utente e trattamento fiscale.
4. **Incentivo alla spesa.** Un cashback sulla spesa dentro giochi frequentati da
   minori è, nella sostanza, un incentivo a spendere di più. Vanno previsti tetti
   di spesa incentivata, messaggi di gioco responsabile e la possibilità per i
   genitori di escludere il figlio dal programma. Il codice prevede già tetti
   giornalieri (`RBX_MAX_DAILY_CASHBACK`); la policy è una scelta di prodotto.
5. **Rapporto con i partner.** Il contratto deve coprire: base di calcolo della
   commissione, finestra di attribuzione, gestione dei rimborsi, diritto di audit
   sui dati che il loro server ci manda, e il fatto che ci paghino in Robux.

## Rischi residui, dichiarati

- Se Roblox cambia idea sui deep link o sul `LaunchData`, l'attribuzione
  automatica salta e resta solo il fallback (intent recente).
- Se un partner smette di mandarci gli acquisti, non ce ne accorgiamo in tempo
  reale: la riconciliazione mensile (vedi [OPERATIONS.md](OPERATIONS.md)) è
  l'unico controllo.
- Un partner disonesto può gonfiare gli acquisti per farsi pagare cashback su
  traffico che non abbiamo portato. Il risk engine e i tetti limitano il danno,
  la riconciliazione lo scopre, il contratto lo sanziona.
