# Come mettere online il sito

Tempo necessario: circa un'ora, più l'attesa per l'attivazione del dominio (da qualche ora fino a 48 ore).

Ti serve il file **sito-simona-cappello.zip**. Scaricalo su un computer: questi passaggi sono molto più comodi da computer che da telefono.

---

## Parte 1. Mettere online il sito su Netlify (gratis)

1. Sul computer, apri il file **sito-simona-cappello.zip** con un doppio clic: si crea una cartella che si chiama **site**.
2. Vai su **app.netlify.com/signup** e registrati gratis (puoi usare "Sign up with email" con simonacappello@gmail.com).
3. Una volta dentro, vai su **app.netlify.com/drop**.
4. Trascina la cartella **site** dentro il riquadro della pagina.
5. Dopo qualche secondo il sito è online, con un indirizzo provvisorio del tipo `nome-strano-123.netlify.app`. Aprilo e controlla che sia tutto a posto.

### Dare un nome all'indirizzo provvisorio

6. Nel menu del sito vai su **Site configuration**, poi **Change site name**.
7. Scrivi `simonacappellopsicologa` e salva. Ora l'indirizzo provvisorio è `simonacappellopsicologa.netlify.app`.

### Ricevere i messaggi del modulo di contatto via email

8. Nel menu del sito apri **Forms** e premi **Enable form detection**.
9. Torna su **Deploys** e trascina di nuovo la cartella **site** nel riquadro in fondo alla pagina. Serve perché Netlify "veda" il modulo.
10. Vai su **Site configuration**, poi **Notifications**, poi **Emails and webhooks**. In **Form submission notifications** premi **Add notification**, scegli **Email notification**, inserisci `simonacappello@gmail.com` e salva.
11. Fai una prova: compila il modulo nella pagina Contatti del sito e controlla che arrivi l'email (guarda anche nello spam).

---

## Parte 2. Comprare il dominio su Aruba

1. Vai su **aruba.it** e cerca `simonacappellopsicologa.it`.
2. Se è libero, scegli l'offerta **solo dominio** (non serve l'hosting, perché il sito sta su Netlify).
3. Completa l'acquisto. Per i domini .it ti verrà chiesto il codice fiscale: è normale.

---

## Parte 3. Collegare il dominio al sito

### Su Netlify

1. Nel menu del sito vai su **Domain management** e premi **Add a domain**.
2. Scrivi `simonacappellopsicologa.it` e conferma.
3. Netlify ti mostrerà i valori da inserire su Aruba ("DNS records"). Di solito sono due:
   - un record **A** per il dominio principale, con un indirizzo numerico (ad esempio `75.2.60.5`);
   - un record **CNAME** per `www`, che punta a `simonacappellopsicologa.netlify.app`.

   Usa sempre i valori che ti mostra Netlify in quel momento.

### Su Aruba

4. Entra nell'**Area clienti** di Aruba, seleziona il dominio e apri la **gestione DNS**.
5. Modifica il record **A** del dominio inserendo l'indirizzo numerico indicato da Netlify.
6. Modifica (o crea) il record **CNAME** per `www`, inserendo `simonacappellopsicologa.netlify.app`.
7. Salva.

### Attesa

8. Il collegamento si attiva da solo, di solito entro qualche ora (al massimo 48).
9. Quando il dominio funziona, Netlify attiva automaticamente il lucchetto di sicurezza (HTTPS). Puoi controllarlo in **Domain management**, alla voce **HTTPS**.

---

## Parte 4. Dopo la pubblicazione

- **MioDottore:** aggiungi l'indirizzo del sito al tuo profilo.
- **Scheda Google (Google Business Profile):** se non ce l'hai, creala su **business.google.com**, con indirizzo, orari, foto dello studio e link al sito. È lo strumento che porta più persone dalla zona.
- **Google Search Console:** su **search.google.com/search-console** aggiungi il sito e invia la mappa `https://www.simonacappellopsicologa.it/sitemap.xml`. Così Google lo trova prima.
- **Privacy policy:** completa il testo della pagina "Privacy e note legali", ad esempio con iubenda o con un consulente.

---

## Se in futuro vuoi modificare il sito

Ogni volta che il sito cambia, ti verrà data una nuova cartella **site**. Basta entrare su Netlify, aprire **Deploys** e trascinare la nuova cartella nel riquadro in fondo alla pagina: il sito si aggiorna in pochi secondi.
