# Venere — Costruire la lista dei target (starter)

*Strumento operativo di origination. Target: centri estetici da convertire in ambulatorio. Riservato.*

> **AGGIORNAMENTO (settembre 2026).** Il target NON sono le cliniche mediche (contese dai fondi): sono i **centri estetici** (ATECO 96.02.02) **convertibili in ambulatorio**. In Lombardia i trattamenti core (iniettivi, laser medicali) richiedono l'ambulatorio, quindi cerchiamo centri **grandi e affermati** (~90-120 mq, locali distinti, meglio indipendenti). Vedi `Venere_Protocollo_Verifica_Target.md` e `Venere_Fattibilita_Ambulatori.md`.

## Premessa: come si costruisce DAVVERO la lista
**Non con Google e basta.** Il target &egrave; la **coda lunga di centri estetici mid-large** affermati che si trova con:
1. **Annunci di vendita/cessione** (idealista, immobiliare.it, portali di cessione attivit&agrave;) → chi &egrave; gi&agrave; in vendita.
2. **Google Maps / Street View** sulle zone target → mappatura per zona, dimensione, recensioni (base clienti proxy).
3. **Database finanziari** (AIDA / Cerved) filtrati su **ATECO estetica** → screening oggettivo per bilanci.
4. **Network + fornitori** (rep di apparecchiature estetiche/dermocosmesi, laser) → intel qualitativa e **vie calde**.

## Il profilo target (allineato al regime ambulatorio)
- **Centro estetico affermato** (non micro-salon): ricavi indicativi **0,4-1,5M**
- **Immobile convertibile in ambulatorio:** ~**90-120 mq**, frazionabile in **locali distinti** (attesa + 2+ sale + servizi accessibili + percorsi pulito/sporco + sterilizzazione), meglio **indipendente/non condominiale**
- **Base clienti reale e fedele all'insegna** (non a una persona), abituata a trattamenti **injectables-amenable** (peeling, radiofrequenza, laser, IPL)
- **Bacino 100k+ ab.**, zona di reddito/passaggio; cluster prioritari (sotto)
- **Titolare** disponibile a **permanenza 24-36 mesi + rollover**
- **Destinazione d'uso** compatibile (a Milano-TUC di norma ok), stato legittimo dell'immobile in regola

## Scorecard di screening (griglia di punteggio)
Punteggio 1-5 per criterio × peso → totale pesato → priorit&agrave; **A / B / C**. *(Versione completa e pesata nel file `Venere_Scorecard_116_Target.xlsx`.)*

| Criterio | Peso | Punteggio (1-5) | Note |
|---|---|---|---|
| Convertibilit&agrave; immobile ad ambulatorio | 25% | | il gate: mq, locali distinti, indipendente |
| Base clienti (dimensione + fedelt&agrave; al brand) | 20% | | non legata a una persona |
| Mix servizi injectables-amenable | 10% | | vicinanza della clientela al medico |
| Bacino e location (100k+, reddito) | 10% | | |
| Economics e verificabilit&agrave; (POS, fornitori) | 15% | | anti-nero |
| Motivazione e apertura del titolare | 15% | | pensione / crescita / rollover |
| Reputazione / compliance | 5% | | recensioni, zero baggage |
| **Totale pesato** | 100% | | → A (≥4), B (3-4), C (<3) |

## Dove prendere i dati (fonti concrete)
- **Portali di vendita:** idealista, immobiliare.it, portali di **cessione attivit&agrave;/licenze** → centri gi&agrave; in vendita (venditore motivato).
- **Google Maps:** cerca "centro estetico" nelle zone target → dimensione stimata, recensioni (n. e voto = base clienti proxy), anni di attivit&agrave;.
- **AIDA / Cerved:** filtra per **ATECO 96.02.02** (*servizi degli istituti di bellezza*) + **regione/provincia** + **ricavi 0,4-1,5M** → estrai la platea con bilanci.
- **Fornitori di apparecchiature estetiche / dermocosmesi / laser** → volumi reali + intro calde.
- **Network** (incluso quello di Marcello per la parte medica) → chi vende, chi &egrave; credibile, chi &egrave; vicino alla pensione.

## Il funnel (dalla platea alla shortlist)
1. **Platea** (annunci + Maps + AIDA: centinaia per cluster)
2. → **Pre-screen da desk** (immobile convertibile ad ambulatorio, dimensione, zona) → decine
3. → **Screen di fit** (base clienti, injectables-amenable, reputazione) → ~15-25
4. → **Screen "via calda"** (chi possiamo raggiungere con intro) → ~10
5. → **Shortlist prioritizzata A/B/C** con la scorecard → **5-8 target A** per il primo cluster

## Cluster map (priorit&agrave;)
Regola: **un solo cluster per partire** (densit&agrave; = leva operativa).
- **Milano first — priorit&agrave; 1:** Milano + hinterland. Densit&agrave;, reddito, bacino, indifferenza funzionale del PGT (destinazione d'uso raramente un ostacolo).
- **Nord-Est — priorit&agrave; 1-2:** Verona, Padova, Venezia, Bologna. *(Verona lega alla pratica esistente di Marcello → vie calde naturali.)*
- **Nord-Ovest / Roma — priorit&agrave; 2:** Torino, Brescia, Bergamo; Roma come secondo cluster.

**Suggerimento:** parti da **Milano** (dove hai gi&agrave; il prescreen di 9 centri reali in `Venere_Prescreen_Milano_annunci.csv`) e usa il `Venere_Funnel_Tracker.xlsx` per gestire la pipeline.

## Prossimi passi operativi
1. **Estrai la platea** del primo cluster (annunci + Google Maps + AIDA su ATECO 96.02.02).
2. **Pre-screen da desk** con il `Venere_Protocollo_Verifica_Target.md` (gate immobile/ambulatorio) → scarta i non convertibili.
3. **Prioritizza con la scorecard** → shortlist **A (5-8 target)**.
4. **Attiva le vie calde** e i primi contatti (kit in `Venere_Kit_Contatto_Titolari.md`).

*Nota: metodo per costruire la lista con dati reali e verificabili. I numeri di bilancio e i segnali di "disponibilit&agrave; a vendere" vanno raccolti da AIDA/annunci/network, non stimati a tavolino.*
