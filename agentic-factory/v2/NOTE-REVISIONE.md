# Agentic Factory v2: note di revisione (interne)

Bozza interna del 23 ottobre 2026, da approvare. Non inviata né condivisa con clienti.

- Nuova versione modificabile: https://claude.ai/artifact/T8MqXvjc85W82SQTXHLCLL (privata, 31 slide)
- Versione di sicurezza: l'originale https://claude.ai/artifact/TG9MEpDR8mEuDRCfJBQ5Do non è stato toccato (era in sola consultazione); copia dei sorgenti in `../v1-originale/`
- PDF: `Agentic-Factory-v2-bozza-interna.pdf`, generato con `tools/render.js` (rendering locale con Chromium che approssima il motore delle slide; per la versione finale conviene esportare il PDF dal menu Share › Export del deck)

## Struttura

| Sezione | Slide |
|---|---|
| Posizionamento e contesto | 1 copertina · 2 posizionamento · 3 quattro domande del CIO · 4 visione 2028 |
| La factory | 5 ciclo in 11 fasi · 6 deliverable dell'advisory · 7 Factory Lead |
| Percorso | 8 quattro fasi con gate · 9 Blueprint · 10 Launch · 11 Scale & Leadership · 12 Evolution Office |
| Misura e controllo | 13 KPI · 14 governance · 15 prove di capacità |
| Offerta | 16 due offerte · 17 IP e know-how · 18 prossimo passo |
| Appendice | 19–20 ciclo per fase · 21 Evolution Office · 22 definizioni KPI · 23 controlli Claude Code · 24 standard fornitori · 25 dati esterni e ipotesi · 26 costo strumenti · 27 obblighi e fondi · 28 fonti |
| Interno, da togliere prima dell'invio | 29 da validare · 30 sostenibilità prezzi · 31 adattamento alle tre opportunità |

## Modifiche principali e motivazioni

1. **Posizionamento** (slide 1–2): dal "coding agent con i fornitori sotto controllo" a una factory AI-oriented end-to-end. Il messaggio centrale ha una slide dedicata. Claude Code è presentato come strumento del kit, non come prodotto.
2. **Statistiche generiche ridotte** (slide 3): tolti i dati Istat e ICT e la slide "dati a favore e contro". Resta solo DORA 2025, verificato. METR va in appendice; Anthropic, Microsoft, Uplevel, GitClear e Veracode sono stati tolti perché non riverificati, e GitClear era già segnato "da verificare".
3. **Visione 2028 come roadmap** (slide 4): tre orizzonti, con la delega decisa dai dati fase per fase e nessuna promessa di automazione totale.
4. **Ciclo completo** (slide 5 e 19–20): 11 fasi, per ognuna responsabile umano, attività delegabili, output e controllo, metrica.
5. **Deliverable concreti** (slide 6): otto deliverable, ciascuno con un responsabile e un criterio di accettazione.
6. **Factory Lead** (slide 7): competenze, percorso (formazione, affiancamento, conduzione osservata) e criterio di qualificazione con evidenze.
7. **Fasi con risultati e gate** (slide 8–11): per ogni fase risultati acquistati, perimetro, prerequisiti, impegno del cliente e gate (proseguire, correggere, fermarsi). Il Launch richiede almeno un flusso end-to-end e dichiara che i suoi risultati non sono una prova statistica.
8. **Factory Evolution Office** (slide 12 e 21): sostituisce canone e club. Backlog trimestrale, review mensili, rilasci verificati, regressione dopo cambi di modello, coaching, estensione, revisione architettura e fornitori. Definisce capacità, cadenze, presa in carico (2 giorni lavorativi, niente 24/7) ed esclusioni. Il club diventa un accessorio.
9. **Misura** (slide 13 e 22): lead time complessivo separato dal DORA change lead time (dal commit); change fail rate separato da deployment rework rate (definizioni dora.dev aggiornate al 5 gennaio 2026); costo per risultato accettato; adozione e autonomia; segmentazione per complessità e rischio; nessuna classifica individuale.
10. **Governance** (slide 14 e 23): distingue policy, controlli tecnici e verifica. Tolti assoluti come "non aggirabile" e "no bypass": la documentazione Anthropic dice che le impostazioni gestite sono "un controllo lato client, non un confine di sicurezza", che gli hook in caso di errore lasciano passare l'azione salvo configurazione esplicita, e che la residenza dati dell'API prevede oggi solo inferenza globale o USA. La matrice comparativa a 5 strumenti è stata tolta perché non riverificata.
11. **Prove** (slide 15): due casi con contesto, intervento, risultati, qualità e limiti. Tolti i conteggi di skill e commit. Il Partner Network è presentato come adesione, non come certificazione. I placeholder restano visibili in arancione.
12. **Offerta** (slide 16 e 30): l'offerta circoscritta da 70–110 k€ è separata dall'offerta enterprise a fasi. Tolto lo sconto automatico del 100% sull'assessment. Advisory è separata da delivery, licenze, infrastruttura, AMS e supporto.
13. **IP** (slide 17): impostazione da validare con il legale. Il rinnovo finanzia l'evoluzione e non blocca l'uso di quanto già pagato.
14. **Agevolazioni in appendice** (slide 27): corretti gli importi e lo stato dei bandi (vedi sotto).
15. **Prossimo passo** (slide 18): incontro di 90 minuti con sponsor, delivery e sicurezza. Nessun accesso ai repository prima di autorizzazioni e perimetro.
16. **Costi tool** (slide 26): scenario con quattro voci (licenze, consumo, infrastruttura, integrazioni). Solo listino Claude verificato. La tabella degli altri vendor è stata tolta perché non riverificata.
17. **Note del relatore** riscritte su tutte le slide. Quelle delle slide interne spiegano cosa manca.

## Da validare prima di presentare

**Dati mancanti (non inventati)**
- `[N persone]` e `[M progetti]` del caso interno, con le metriche prima e dopo. In Drive e Slack non ho trovato dati verificati.
- Un caso cliente con consenso alla citazione. Senza questi dati la slide 15 va tolta.
- Contatti nella slide 18.
- Tier e stato attuale nel Claude Partner Network (ripreso dalla v1, non riverificato).

**Prezzi e condizioni (ipotesi, non approvati)**
- Tutti i range della slide 16. Tariffa media ipotizzata di 1.000 €/giorno e costo pieno di 500 €/giorno: entrambi da confermare con l'amministrazione.
- Esito della prima verifica (slide 30):
  - Blueprint: regge.
  - Launch: regge a circa 2 FTE; a 2,5 FTE servono 100–125 k€ oppure un perimetro più stretto.
  - Scale: regge fino a circa 8 lead.
  - Evolution: 12 k€ regge solo per un team. Proposte due taglie, 12 k€ (circa 12 giorni) e 20 k€ (circa 20 giorni).
- Credito Blueprint proposto: fino al 20% solo per le attività riassorbite, se il Launch parte entro 60 giorni.
- Capacità dell'Evolution Office, presa in carico entro 2 giorni lavorativi, criteri di qualificazione dei lead (di norma 2 cicli).
- Impostazione IP: revisione del legale.

**Fonti da riaprire** (pagina primaria non raggiungibile dall'ambiente di verifica)
- AI Act art. 4 come modificato dal Reg. UE 2026/1744, e FAQ della Commissione. Le fonti secondarie concordano su "misure per sostenere l'alfabetizzazione, nessun livello minimo garantito, basta un registro interno".
- L. 132/2025 art. 11 su Normattiva.
- METR luglio 2025, pagina primaria.

**Agevolazioni (verifica del 23 ottobre 2026)**
- Fondimpresa Avviso 3/2026:
  - 50–150 k€ **per piano**, 100–300 k€ per i piani multiregionali; massimo 50 k€ **per impresa** dal Conto di Sistema. La v1 indicava "50-300 k€ per azienda", che era sbagliato.
  - Scade il 30 ottobre 2026 e la domanda la presentano solo soggetti proponenti qualificati.
  - Le grandi imprese aderenti sono ammesse, con almeno il 10% di allievi da PMI.
- MIMIT competenze PMI Sud:
  - contributo del 50% su costi da 10 a 60 k€, contributo massimo 30 k€. La v1 indicava "progetti 5-30 k€", che era sbagliato.
  - Solo PMI di 7 regioni del Sud; sportello aperto fino al 21 dicembre 2026.
- Lombardia "Competenze & Innovazione": sportello sospeso da maggio 2026 per esaurimento fondi; solo MPMI.
- Piemonte voucher digitalizzazione:
  - **discrepanza**: la revisione interna lo dava chiuso, ma il bando indicizzato riporta un'apertura dal 22 ottobre al 15 dicembre 2026. Da ricontrollare sul sito della Regione.
  - Solo PMI.
- Per i tre clienti (grandi imprese) Lombardia, Piemonte e MIMIT non si applicano, salvo che Digital Boîte risulti una PMI (da verificare). Il canale realistico è il conto formazione del fondo interprofessionale di adesione.

**Nomi**
- "Digital Boats" è in realtà **Digital Boîte S.r.l.**, la società che gestisce l'e-commerce nel gruppo Liu Jo. Confermato da Slack interno ("DIGITAL BOÎTE SRL") e da fonti web. Da confermare con l'account.
- Per gli altri due clienti si usano "AXA Italia" e "Luxottica (gruppo EssilorLuxottica)".

## Traccia di presentazione per il cliente (circa 30 minuti)

1. **Apertura (2 min).** Lo scopo non è adottare uno strumento: è costruire una factory che gestirete voi. Leggere la frase della slide 2.
2. **Le vostre domande (3 min).** Slide 3: velocità, qualità, controllo, persone. Chiedere quale delle quattro pesa di più e annotarlo.
3. **Dove volete arrivare (3 min).** Slide 4: tre orizzonti fino al 2028. Quanto delegare lo decidono i dati, fase per fase.
4. **Cosa cambia nel lavoro (6 min).** Slide 5 e 6: undici fasi, il codice è una sola di queste. Otto deliverable che restano in uso.
5. **Le persone (3 min).** Slide 7: il Factory Lead e come lo qualifichiamo.
6. **Come ci arriviamo (6 min).** Slide 8–12: quattro fasi, ogni gate permette di proseguire, correggere o fermarsi. Il Blueprint vale anche da solo. L'Evolution Office è facoltativo.
7. **Come misuriamo e governiamo (4 min).** Slide 13–14: misure distinte e oneste; difesa in profondità, non promesse assolute.
8. **Offerta e IP (3 min).** Slide 16–17: cifre indicative da stringere sul perimetro; ciò che pagate resta vostro.
9. **Chiusura (2 min).** Slide 18: proporre data e partecipanti dell'incontro di definizione.

Prima di inviare il deck: togliere le slide 29–31, compilare o togliere la slide 15, riaprire le fonti secondarie, rimuovere dalle note le frasi marcate "Nota interna" e personalizzarlo per un solo cliente.
