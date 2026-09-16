#!/usr/bin/env node
/**
 * Prova end-to-end contro un server già avviato in modalità mock:
 *
 *   RBX_MODE=mock RBX_ADMIN_TOKEN=dev npm start
 *   RBX_ADMIN_TOKEN=dev node scripts/demo.js
 *
 * Simula: collegamento account, avvio del gioco dall'app, acquisto dentro al
 * gioco, sblocco del cashback e richiesta di payout.
 */
const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:8787';
const ADMIN = process.env.RBX_ADMIN_TOKEN ?? 'dev';

const call = async (path, { method = 'GET', body, token, admin, gameKey } = {}) => {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(gameKey ? { authorization: `Bearer ${gameKey.keyId}.${gameKey.secret}` } : {}),
      ...(admin ? { 'x-admin-token': ADMIN } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(`${method} ${path} → ${response.status} ${JSON.stringify(payload)}`);
  return payload;
};

const step = (title, value) => console.log(`\n▸ ${title}\n  ${JSON.stringify(value)}`);

const partner = await call('/v1/admin/partners', {
  method: 'POST',
  admin: true,
  body: { name: 'Demo Studios', commissionBps: 2500 }
});
const game = await call(`/v1/admin/partners/${partner.id}/games`, {
  method: 'POST',
  admin: true,
  body: { placeId: Math.floor(Math.random() * 9_000_000) + 1_000_000, name: 'Demo Tycoon', description: 'Gioco di prova' }
});
const gameKey = await call(`/v1/admin/games/${game.id}/keys`, { method: 'POST', admin: true });
step('partner e gioco registrati', { game: game.name, keyId: gameKey.keyId });

const challenge = await call('/v1/auth/start', { method: 'POST', body: { username: 'DemoPlayer' } });
await call('/v1/admin/dev/mock-bio', {
  method: 'POST',
  admin: true,
  body: { robloxUserId: challenge.robloxUserId, description: `bio con codice ${challenge.code}` }
});
const auth = await call('/v1/auth/confirm', { method: 'POST', body: { challengeId: challenge.challengeId } });
step('account Roblox collegato', auth.user);

const launch = await call(`/v1/games/${game.id}/launch`, { method: 'POST', token: auth.token });
step('deep link generato', { deepLink: launch.deepLink });

const attribution = await call('/v1/game/session/attribute', {
  method: 'POST',
  gameKey,
  body: { launchToken: launch.token, robloxUserId: auth.user.robloxUserId, jobId: 'demo-job' }
});
step('sessione attribuita dal server di gioco', attribution);

const purchase = await call('/v1/game/purchase', {
  method: 'POST',
  gameKey,
  body: {
    receiptId: `demo-${Date.now()}`,
    robloxUserId: auth.user.robloxUserId,
    productId: 4242,
    productName: 'Pacchetto gemme',
    robuxSpent: 800
  }
});
step('acquisto segnalato (800 R$ spesi)', purchase);

step('portafoglio', await call('/v1/wallet', { token: auth.token }));
step('statistiche piattaforma', await call('/v1/admin/stats', { admin: true }));
console.log('\nIl cashback resta in maturazione per il periodo di hold: con RBX_HOLD_DAYS=0 è subito riscattabile.');
