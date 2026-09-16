import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestApp, gameRequest, playerRequest, adminRequest, linkAccount, startPlaySession } from './helpers.js';
import { advanceClock, resetClock, now } from '../src/util/clock.js';
import { config } from '../src/config.js';

test.afterEach(() => resetClock());

test('senza firma valida il server di gioco non passa', async () => {
  const { app, key } = createTestApp();
  const bad = await gameRequest(app, key, {
    path: '/v1/game/config',
    method: 'GET',
    overrides: { signature: 'a'.repeat(64) }
  });
  assert.equal(bad.status, 401);
  assert.equal(bad.body.error, 'bad_signature');
});

test('una firma fatta con un segreto sbagliato non passa', async () => {
  const { app, key } = createTestApp();
  const bad = await gameRequest(app, key, {
    path: '/v1/game/config',
    method: 'GET',
    overrides: { secret: 'segreto-inventato' }
  });
  assert.equal(bad.status, 401);
});

test('il nonce non si può riusare (anti-replay)', async () => {
  const { app, roblox, game, key } = createTestApp();
  const { token } = await linkAccount(app, roblox);
  await startPlaySession({ app, key, game, token });

  const body = { receiptId: 'rcpt-replay', robloxUserId: 4242, productId: 1, robuxSpent: 100 };
  const rawTimestamp = now();
  const first = await gameRequest(app, key, {
    path: '/v1/game/purchase',
    body,
    overrides: { nonce: 'nonce-fisso', timestamp: rawTimestamp }
  });
  const replay = await gameRequest(app, key, {
    path: '/v1/game/purchase',
    body,
    overrides: { nonce: 'nonce-fisso', timestamp: rawTimestamp }
  });
  assert.equal(first.status, 201);
  assert.equal(replay.status, 403);
  assert.equal(replay.body.error, 'replayed_nonce');
});

test('una firma vecchia oltre la finestra di skew viene rifiutata', async () => {
  const { app, key } = createTestApp();
  const stale = await gameRequest(app, key, {
    path: '/v1/game/config',
    method: 'GET',
    overrides: { timestamp: now() - config.signatureSkewMs - 10_000 }
  });
  assert.equal(stale.status, 401);
  assert.equal(stale.body.error, 'stale_signature');
});

test('il corpo non può essere alterato dopo la firma', async () => {
  const { app, roblox, game, key } = createTestApp();
  const { token } = await linkAccount(app, roblox);
  await startPlaySession({ app, key, game, token });

  const honest = { receiptId: 'rcpt-tamper', robloxUserId: 4242, productId: 1, robuxSpent: 100 };
  const rawBody = JSON.stringify(honest);
  const timestamp = now();
  const nonce = 'nonce-tamper';
  const { sign } = await import('../src/http/signature.js');
  const signature = sign({ secret: key.secret, timestamp, nonce, method: 'POST', path: '/v1/game/purchase', body: rawBody });

  const tampered = await app.dispatch({
    method: 'POST',
    url: '/v1/game/purchase',
    rawBody: JSON.stringify({ ...honest, robuxSpent: 1_000_000 }),
    headers: {
      'x-cashback-key': key.keyId,
      'x-cashback-timestamp': String(timestamp),
      'x-cashback-nonce': nonce,
      'x-cashback-signature': signature
    }
  });
  assert.equal(tampered.status, 401);
  assert.equal(tampered.body.error, 'bad_signature');
});

test('una chiave revocata smette di funzionare', async () => {
  const { app, game, key } = createTestApp();
  const rotated = await adminRequest(app, { method: 'POST', path: `/v1/admin/games/${game.id}/keys` });
  assert.ok(rotated.body.secret);

  const old = await gameRequest(app, key, { path: '/v1/game/config', method: 'GET' });
  assert.equal(old.status, 401);
  assert.equal(old.body.error, 'unknown_key');

  const fresh = await gameRequest(app, rotated.body, { path: '/v1/game/config', method: 'GET' });
  assert.equal(fresh.status, 200);
});

test('il codice di verifica funziona solo se è davvero nella bio', async () => {
  const { app } = createTestApp();
  const start = await playerRequest(app, { method: 'POST', path: '/v1/auth/start', body: { username: 'LucaPlays' } });
  const confirm = await playerRequest(app, {
    method: 'POST',
    path: '/v1/auth/confirm',
    body: { challengeId: start.body.challengeId }
  });
  assert.equal(confirm.status, 400);
  assert.equal(confirm.body.error, 'code_not_found');
});

test('il codice di verifica scade', async () => {
  const { app, roblox } = createTestApp();
  const start = await playerRequest(app, { method: 'POST', path: '/v1/auth/start', body: { username: 'LucaPlays' } });
  roblox.setDescription(start.body.robloxUserId, start.body.code);
  advanceClock(31 * 60_000);
  const confirm = await playerRequest(app, {
    method: 'POST',
    path: '/v1/auth/confirm',
    body: { challengeId: start.body.challengeId }
  });
  assert.equal(confirm.status, 400);
  assert.equal(confirm.body.error, 'challenge_expired');
});

test('le rotte del portafoglio richiedono un token valido', async () => {
  const { app } = createTestApp();
  assert.equal((await playerRequest(app, { path: '/v1/wallet' })).status, 401);
  assert.equal((await playerRequest(app, { path: '/v1/wallet', token: 'token-finto' })).status, 401);
});

test('il back office richiede il token admin', async () => {
  const { app } = createTestApp();
  const result = await app.dispatch({ method: 'POST', url: '/v1/admin/settle', headers: { 'x-admin-token': 'nope' } });
  assert.equal(result.status, 401);
});

test('acquisti molto grandi finiscono in revisione con hold esteso', async () => {
  const { app, roblox, game, key } = createTestApp();
  const { token } = await linkAccount(app, roblox);
  await startPlaySession({ app, key, game, token });

  const big = await gameRequest(app, key, {
    path: '/v1/game/purchase',
    body: { receiptId: 'rcpt-big', robloxUserId: 4242, productId: 1, robuxSpent: 20_000 }
  });
  assert.equal(big.body.status, 'review');

  advanceClock(config.holdMs + 1000);
  const settled = await adminRequest(app, { method: 'POST', path: '/v1/admin/settle' });
  assert.equal(settled.body.settled, 0); // in revisione: non si sblocca da solo
});

test('il tetto giornaliero di cashback manda in revisione gli acquisti successivi', async () => {
  const { app, roblox, game, key } = createTestApp();
  const { token } = await linkAccount(app, roblox);
  await startPlaySession({ app, key, game, token });

  const first = await gameRequest(app, key, {
    path: '/v1/game/purchase',
    body: { receiptId: 'rcpt-cap-1', robloxUserId: 4242, productId: 1, robuxSpent: 9_000 }
  });
  assert.equal(first.body.status, 'awarded'); // 900 Robux di cashback

  const second = await gameRequest(app, key, {
    path: '/v1/game/purchase',
    body: { receiptId: 'rcpt-cap-2', robloxUserId: 4242, productId: 1, robuxSpent: 9_000 }
  });
  assert.equal(second.body.status, 'awarded');

  // Superato il tetto di 5000 Robux giornalieri di cashback.
  let last = null;
  for (let i = 3; i <= 8; i += 1) {
    last = await gameRequest(app, key, {
      path: '/v1/game/purchase',
      body: { receiptId: `rcpt-cap-${i}`, robloxUserId: 4242, productId: 1, robuxSpent: 9_000 }
    });
  }
  assert.equal(last.body.status, 'review');
});

test('un account Roblox appena creato ha un hold prolungato', async () => {
  const { app, roblox, game, key } = createTestApp({
    robloxUsers: [
      { robloxUserId: 888, username: 'Nuovo', displayName: 'Nuovo', createdAt: Date.parse('2026-02-28T00:00:00Z') }
    ]
  });
  const { token } = await linkAccount(app, roblox, 'Nuovo');
  await startPlaySession({ app, key, game, token, robloxUserId: 888 });
  await gameRequest(app, key, {
    path: '/v1/game/purchase',
    body: { receiptId: 'rcpt-new', robloxUserId: 888, productId: 1, robuxSpent: 500 }
  });

  advanceClock(config.holdMs + 1000);
  assert.equal((await adminRequest(app, { method: 'POST', path: '/v1/admin/settle' })).body.settled, 0);
  advanceClock(config.extendedHoldMs);
  assert.equal((await adminRequest(app, { method: 'POST', path: '/v1/admin/settle' })).body.settled, 1);
});

test('il token bearer del SDK Luau autentica il server di gioco', async () => {
  const { app, key } = createTestApp();
  const ok = await app.dispatch({
    method: 'GET',
    url: '/v1/game/config',
    headers: { authorization: `Bearer ${key.keyId}.${key.secret}` }
  });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.cashbackPercent, 10);

  const wrong = await app.dispatch({
    method: 'GET',
    url: '/v1/game/config',
    headers: { authorization: `Bearer ${key.keyId}.segreto-sbagliato` }
  });
  assert.equal(wrong.status, 401);
  assert.equal(wrong.body.error, 'bad_credentials');
});

test('il bearer di una chiave revocata non funziona più', async () => {
  const { app, game, key } = createTestApp();
  await adminRequest(app, { method: 'POST', path: `/v1/admin/games/${game.id}/keys` });
  const old = await app.dispatch({
    method: 'GET',
    url: '/v1/game/config',
    headers: { authorization: `Bearer ${key.keyId}.${key.secret}` }
  });
  assert.equal(old.status, 401);
  assert.equal(old.body.error, 'unknown_key');
});
