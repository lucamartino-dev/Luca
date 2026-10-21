// Chiude il menu mobile dopo un clic
document.querySelectorAll('details.mnav a').forEach(function (a) {
  a.addEventListener('click', function () { a.closest('details').open = false; });
});

// Anno corrente nel footer
document.querySelectorAll('[data-year]').forEach(function (el) {
  el.textContent = new Date().getFullYear();
});

// Modulo contatti: anteprima finché non viene collegato a un servizio di invio
var form = document.getElementById('contact-form');
if (form) {
  // Sul sito pubblicato (Netlify) il modulo viene inviato davvero; altrove resta un'anteprima
  var live = /simonacappellopsicologa\.it$|netlify\.app$/.test(location.hostname);
  form.addEventListener('submit', function (e) {
    var status = document.getElementById('form-status');
    if (!form.checkValidity()) {
      e.preventDefault();
      status.textContent = 'Per inviare la richiesta servono nome, un recapito e il consenso privacy.';
    } else if (live) {
      return;
    } else {
      e.preventDefault();
      status.textContent = 'Grazie. In questa anteprima il modulo non invia ancora messaggi: verrà collegato alla tua email al momento della pubblicazione.';
      form.reset();
    }
    status.hidden = false;
  });
}
