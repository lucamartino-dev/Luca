# Lusha - Filtri per trovare i decision maker dei fondi

Obiettivo: individuare le persone giuste dentro un fondo/investitore (chi decide
gli investimenti) e rivelarne email e telefono. Risolvere i filtri NON consuma
crediti: in caso di dubbio rilancia la risoluzione filtri (`*_filters`) per
riallineare i valori. Il reveal/enrichment del contatto SI consuma crediti.

Nota sui nomi dei tool: variano per versione del connettore. Carica con
`tool_search` (query "Lusha") e mappa l'equivalente di: ricerca contatti/
decision maker, ricerca aziende, risoluzione filtri, enrichment/reveal, usage.
Set di nomi noti: `prospecting_contact_search` / `prospecting_contact_enrich` /
`prospecting_company_search` / `prospecting_contact_filters` / `account_usage`,
oppure `decision_makers_search` / `recommendations_contacts` /
`recommendations_companies` / `recommendations_contacts_filters` /
`purchase_options`. Usa quelli presenti nella sessione.

## Due strade per arrivare ai contatti

**A. Per nome del fondo (preferita quando hai gia la mappa investitori).**
Cerca i contatti filtrando per l'azienda/fondo specifico (campo nome azienda o
company id) + ruoli investment. Cosi rimani dentro i fondi in target del filtro
di fit, senza allargare a caso.

**B. Per settore/industria (per scoprire nuovi fondi in IT).**
Cerca aziende con industria = venture capital / private equity / investment
management in Italia, poi per ciascuna i contatti con ruoli investment. Usa
questa strada solo per espandere la mappa; passa comunque dal filtro di fit.

## Job titles (ruoli investment) — filtro `jobTitles`

Stringhe libere. Set consigliato:
"Managing Partner", "General Partner", "Founding Partner", "Partner",
"Managing Director", "Principal", "Investment Director", "Investment Manager",
"Head of Investments", "Venture Partner", "Investment Principal",
"Director of Investments", "Chief Investment Officer", "CIO" (inteso come Chief
Investment Officer nei family office — attenzione all'omonimia con Chief
Information Officer), "Founder" (per fondi/angel founder-led),
"Socio" / "Investment Associate" (opzionali, primo contatto).

## Seniority — filtro `seniority` (ID)

| ID | Nome |
|---|---|
| 10 | founder |
| 7 | partner |
| 9 | c-suite |
| 8 | vice president |
| 6 | director |
| 5 | manager |

ICP investitori: usa 10 (founder), 7 (partner), 9 (c-suite), 8 (vp), 6
(director). Aggiungi 5 (manager) solo per catturare "Investment Manager".

## Dipartimenti — filtro `departments`

Nei fondi i ruoli investment cadono di solito sotto "General Management" e
"Finance". Usa entrambi. Non filtrare su "Information Technology" (intercetta i
CIO informatici, non gli investitori). Se il filtro azienda e gia stretto sul
fondo, il dipartimento puo anche essere lasciato ampio.

## Paese — filtro `countries`

Codici ISO-2. Italia = "IT". Per fondi paneuropei con team in Italia puoi
aggiungere il paese HQ (es. "GB", "FR", "DE") ma marca il contatto come "estero
con presenza IT" e privilegia chi copre l'Italia.

## existing_data_points

Per non sprecare reveal, se il connettore lo supporta filtra a monte i contatti
per cui Lusha ha gia l'email (valore relativo alle email, es. "emails"), o il
telefono se serve il mobile. Verifica il valore esatto con la risoluzione filtri
(`*_filters`) prima dell'uso.

## Esempio di payload (ricerca contatti, strada A)

```json
{
  "companyNames": ["<Nome del fondo>"],
  "jobTitles": ["Managing Partner","General Partner","Partner","Principal",
    "Investment Director","Investment Manager","Head of Investments",
    "Managing Director","Founder"],
  "departments": ["General Management","Finance"],
  "seniority": [10, 7, 9, 8, 6],
  "countries": ["IT"],
  "existing_data_points": ["emails"],
  "page": 0,
  "page_size": 25
}
```

I nomi esatti dei campi dipendono dal tool disponibile: adatta (es.
`company_names`, `company_ids`, `job_titles`) leggendo lo schema del tool
caricato. La ricerca restituisce un'anteprima senza reveal: da li selezioni gli
ID nuovi (dopo dedup vs master) e solo su quelli chiami l'enrichment.

## Regola anti-spreco

- Controlla l'usage prima di rivelare.
- Rivela solo contatti nuovi (non nel master) e in fondi che hanno superato il
  filtro di fit.
- Per angel/club deal e fondi piccoli, prima prova l'email pubblica del canale
  del fondo via web: spesso e quella giusta per il primo contatto e non costa
  reveal.
- Cap di default: 25 reveal per run.
