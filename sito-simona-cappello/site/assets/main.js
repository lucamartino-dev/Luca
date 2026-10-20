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
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var status = document.getElementById('form-status');
    if (!form.checkValidity()) {
      status.textContent = 'Per inviare la richiesta servono nome, un recapito e il consenso privacy.';
    } else {
      status.textContent = 'Grazie. In questa anteprima il modulo non invia ancora messaggi: verrà collegato alla tua email al momento della pubblicazione.';
      form.reset();
    }
    status.hidden = false;
  });
}
