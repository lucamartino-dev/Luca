const TOKEN_KEY = 'robuxback.token';

const state = {
  token: localStorage.getItem(TOKEN_KEY),
  user: null,
  challengeId: null,
  minPayout: 100
};

const $ = (id) => document.getElementById(id);
const show = (id, visible) => $(id).classList.toggle('hidden', !visible);

let toastTimer = null;
const toast = (message, isError = false) => {
  const element = $('toast');
  element.textContent = message;
  element.classList.toggle('error', isError);
  element.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.add('hidden'), 4000);
};

const api = async (path, { method = 'GET', body } = {}) => {
  const response = await fetch(path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(state.token ? { authorization: `Bearer ${state.token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && state.token) logout(true);
    throw new Error(payload.message ?? 'Qualcosa è andato storto');
  }
  return payload;
};

const robux = (value) => `${Number(value).toLocaleString('it-IT', { maximumFractionDigits: 2 })}`;

const relative = (timestamp) => {
  const diff = timestamp - Date.now();
  const days = Math.ceil(diff / 86_400_000);
  if (days > 1) return `tra ${days} giorni`;
  if (days === 1) return 'domani';
  if (days === 0) return 'oggi';
  return new Date(timestamp).toLocaleDateString('it-IT');
};

async function refreshGames() {
  const data = await api('/v1/games');
  const list = $('game-list');
  list.innerHTML = '';
  if (data.games.length === 0) {
    list.innerHTML = '<li><span class="meta">Nessun gioco partner attivo in questo momento.</span></li>';
    return;
  }
  for (const game of data.games) {
    const item = document.createElement('li');
    const info = document.createElement('div');
    info.innerHTML = `<div class="title">${escapeHtml(game.name)}</div>
      <div class="meta">${escapeHtml(game.description ?? '')} · cashback ${game.cashbackPercent}%</div>`;
    const button = document.createElement('button');
    button.textContent = state.token ? 'Gioca' : 'Collega account';
    button.addEventListener('click', () => (state.token ? play(game) : show('login', true)));
    item.append(info, button);
    list.append(item);
  }
}

async function play(game) {
  try {
    const intent = await api(`/v1/games/${game.id}/launch`, { method: 'POST' });
    toast(`Sessione tracciata. Buon divertimento su ${game.name}.`);
    // Proviamo il deep link dell'app Roblox; se non risponde, apriamo il web.
    const fallback = setTimeout(() => window.open(intent.webLink, '_blank', 'noopener'), 1200);
    window.location.href = intent.deepLink;
    window.addEventListener('pagehide', () => clearTimeout(fallback), { once: true });
  } catch (error) {
    toast(error.message, true);
  }
}

async function refreshWallet() {
  if (!state.token) return;
  const wallet = await api('/v1/wallet');
  state.minPayout = wallet.minPayoutRobux;
  $('balance-available').textContent = robux(wallet.availableRobux);
  $('balance-pending').textContent = robux(wallet.pendingRobux);
  $('balance-reserved').textContent = robux(wallet.reservedRobux);
  $('payout-hint').textContent = `Minimo riscattabile: ${wallet.minPayoutRobux} Robux. Totale maturato finora: ${robux(wallet.lifetimeRobux)} R$.`;

  const activity = await api('/v1/wallet/activity?limit=25');
  const list = $('activity-list');
  list.innerHTML = '';
  if (activity.items.length === 0) {
    list.innerHTML = '<li><span class="meta">Ancora nessun movimento: apri un gioco partner da qui.</span></li>';
  }
  for (const item of activity.items) {
    const element = document.createElement('li');
    const stateLabel =
      item.state === 'pending' ? `disponibile ${relative(item.availableFrom)}` : item.state === 'available' ? 'disponibile' : 'stornato';
    element.innerHTML = `<div>
        <div class="title">+${robux(item.cashbackRobux)} R$ · ${escapeHtml(item.game)}</div>
        <div class="meta">${escapeHtml(item.product ?? 'acquisto')} · spesi ${robux(item.spentRobux)} R$</div>
      </div>
      <span class="badge ${item.state}">${stateLabel}</span>`;
    list.append(element);
  }

  const payouts = await api('/v1/payouts');
  const payoutList = $('payout-list');
  payoutList.innerHTML = '';
  for (const payout of payouts.items) {
    const element = document.createElement('li');
    element.innerHTML = `<div>
        <div class="title">${robux(payout.amountRobux)} R$ · ${payout.method === 'gift_card' ? 'gift card' : 'group payout'}</div>
        <div class="meta">${new Date(payout.createdAt).toLocaleDateString('it-IT')}</div>
      </div><span class="badge">${payout.state}</span>`;
    payoutList.append(element);
  }
}

async function loadSession() {
  if (!state.token) return;
  const me = await api('/v1/me');
  state.user = me.user;
  $('account').innerHTML = '';
  const label = document.createElement('span');
  label.textContent = `@${me.user.username}`;
  const button = document.createElement('button');
  button.className = 'secondary';
  button.textContent = 'Esci';
  button.addEventListener('click', () => logout());
  $('account').append(label, button);
  show('login', false);
  show('wallet', true);
  show('activity', true);
  show('hero', false);
}

function logout(silent = false) {
  if (!silent) api('/v1/auth/logout', { method: 'POST' }).catch(() => {});
  localStorage.removeItem(TOKEN_KEY);
  state.token = null;
  state.user = null;
  $('account').innerHTML = '';
  show('wallet', false);
  show('activity', false);
  show('hero', true);
  show('login', true);
  refreshGames();
}

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

$('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = event.target.querySelector('button');
  button.disabled = true;
  try {
    const result = await api('/v1/auth/start', { method: 'POST', body: { username: $('username').value.trim() } });
    state.challengeId = result.challengeId;
    $('challenge-code').textContent = result.code;
    show('challenge', true);
  } catch (error) {
    toast(error.message, true);
  } finally {
    button.disabled = false;
  }
});

$('confirm-btn').addEventListener('click', async (event) => {
  event.target.disabled = true;
  try {
    const result = await api('/v1/auth/confirm', { method: 'POST', body: { challengeId: state.challengeId } });
    state.token = result.token;
    localStorage.setItem(TOKEN_KEY, result.token);
    await loadSession();
    await Promise.all([refreshWallet(), refreshGames()]);
    toast(`Account collegato: @${result.user.username}`);
  } catch (error) {
    toast(error.message, true);
  } finally {
    event.target.disabled = false;
  }
});

$('payout-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await api('/v1/payouts', {
      method: 'POST',
      body: {
        amountRobux: Number($('payout-amount').value),
        method: $('payout-method').value
      }
    });
    $('payout-amount').value = '';
    toast('Richiesta inviata: la trovi in elenco come "requested".');
    await refreshWallet();
  } catch (error) {
    toast(error.message, true);
  }
});

(async () => {
  try {
    await loadSession();
  } catch {
    logout(true);
  }
  show('login', !state.token);
  await refreshGames();
  await refreshWallet().catch(() => {});
})();
