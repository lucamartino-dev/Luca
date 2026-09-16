import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestApp, gameRequest, playerRequest, adminRequest, linkAccount, startPlaySession } from './helpers.js';
import { advanceClock, resetClock } from '../src/util/clock.js';
import * as ledger from '../src/domain/ledger.js';
import { config, MRBX } from '../src/config.js';

test.afterEach(() => resetClock());

test('giro completo: collego l account, gioco, spendo e incasso il 10%', async () => {
  const { app, roblox, game, key, partner } = createTestApp();
  const { token, user } = await linkAccount(app, roblox);
  assert.equal(user.username, 'LucaPlays');

  const { attribution } = await startPlaySession({ app, key, game, token });
  assert.equal(attribution.attributed, true);
  assert.equal(attribution.source, 'launch_token');

  const purchase = await gameRequest(app, key, {
    path: '/v1/game/purchase',
    body: { receiptId: 'rcpt-1', robloxUserId: 4242, productId: 55, productName: 'Spada di fuoco', robuxSpent: 400 }
  });
  assert.equal(purchase.status, 201);
  assert.equal(purchase.body.status, 'awarded');
  assert.equal(purchase.body.cashbackRobux, 40); // 10% di 400

  const wallet = await playerRequest(app, { path: '/v1/wallet', token });
  assert.equal(wallet.body.pendingRobux, 40);
  assert.equal(wallet.body.availableRobux, 0);

  // Il partner ci deve il 25% e noi teniamo la differenza.
  assert.equal(ledger.balance(app.db, ledger.partnerAccount(partner.id)), 100 * MRBX);
  assert.equal(ledger.balance(app.db, 'platform:revenue'), 60 * MRBX);
  assert.equal(ledger.trialBalance(app.db).balanced, true);

  // Prima della fine dell hold il cashback non è riscattabile.
  assert.equal((await adminRequest(app, { method: 'POST', path: '/v1/admin/settle' })).body.settled, 0);

  advanceClock(config.holdMs + 1000);
  assert.equal((await adminRequest(app, { method: 'POST', path: '/v1/admin/settle' })).body.settled, 1);

  const walletAfter = await playerRequest(app, { path: '/v1/wallet', token });
  assert.equal(walletAfter.body.pendingRobux, 0);
  assert.equal(walletAfter.body.availableRobux, 40);
  assert.equal(ledger.trialBalance(app.db).balanced, true);
});

test('lo stesso receipt non paga due volte', async () => {
  const { app, roblox, game, key } = createTestApp();
  const { token, user } = await linkAccount(app, roblox);
  await startPlaySession({ app, key, game, token });

  const body = { receiptId: 'rcpt-dup', robloxUserId: 4242, productId: 7, robuxSpent: 100 };
  const first = await gameRequest(app, key, { path: '/v1/game/purchase', body });
  const second = await gameRequest(app, key, { path: '/v1/game/purchase', body });

  assert.equal(first.body.duplicate, false);
  assert.equal(second.body.duplicate, true);
  assert.equal(second.body.purchaseId, first.body.purchaseId);
  assert.equal(app.db.prepare('SELECT COUNT(*) AS n FROM cashback_awards').get().n, 1);
  assert.equal(ledger.balance(app.db, ledger.userAccount(user.id, 'pending')), 10 * MRBX);
});

test('chi non passa dalla nostra app non riceve cashback', async () => {
  const { app, key } = createTestApp();
  const result = await gameRequest(app, key, {
    path: '/v1/game/purchase',
    body: { receiptId: 'rcpt-organic', robloxUserId: 999_999, productId: 7, robuxSpent: 500 }
  });
  assert.equal(result.body.status, 'unattributed');
  assert.equal(result.body.cashbackRobux, 0);
  assert.equal(app.db.prepare('SELECT COUNT(*) AS n FROM cashback_awards').get().n, 0);
});

test('la sessione scade: gli acquisti troppo tardivi non maturano cashback', async () => {
  const { app, roblox, game, key } = createTestApp();
  const { token } = await linkAccount(app, roblox);
  await startPlaySession({ app, key, game, token });

  advanceClock(config.sessionTtlMs + 60_000);
  const late = await gameRequest(app, key, {
    path: '/v1/game/purchase',
    body: { receiptId: 'rcpt-late', robloxUserId: 4242, productId: 7, robuxSpent: 500 }
  });
  assert.equal(late.body.status, 'unattributed');
});

test('un launch token di un altro utente Roblox viene rifiutato e tracciato', async () => {
  const { app, roblox, game, key } = createTestApp({
    robloxUsers: [{ robloxUserId: 777, username: 'Ladro', displayName: 'Ladro' }]
  });
  const { token } = await linkAccount(app, roblox);
  const launch = await playerRequest(app, { method: 'POST', path: `/v1/games/${game.id}/launch`, token });

  const stolen = await gameRequest(app, key, {
    path: '/v1/game/session/attribute',
    body: { launchToken: launch.body.token, robloxUserId: 777 }
  });
  assert.equal(stolen.status, 403);
  assert.equal(stolen.body.error, 'token_user_mismatch');
  const events = app.db.prepare("SELECT * FROM risk_events WHERE kind = 'launch_token_user_mismatch'").all();
  assert.equal(events.length, 1);
});

test('senza launchData funziona il fallback sull intent recente', async () => {
  const { app, roblox, game, key } = createTestApp();
  const { token } = await linkAccount(app, roblox);
  await playerRequest(app, { method: 'POST', path: `/v1/games/${game.id}/launch`, token });

  const attribution = await gameRequest(app, key, {
    path: '/v1/game/session/attribute',
    body: { robloxUserId: 4242 }
  });
  assert.equal(attribution.body.attributed, true);
  assert.equal(attribution.body.source, 'recent_intent');
});

test('il launch token scaduto non apre sessioni', async () => {
  const { app, roblox, game, key } = createTestApp();
  const { token } = await linkAccount(app, roblox);
  const launch = await playerRequest(app, { method: 'POST', path: `/v1/games/${game.id}/launch`, token });

  advanceClock(config.launchTokenTtlMs + 1000);
  const late = await gameRequest(app, key, {
    path: '/v1/game/session/attribute',
    body: { launchToken: launch.body.token, robloxUserId: 4242 }
  });
  assert.equal(late.status, 400);
  assert.equal(late.body.error, 'launch_token_expired');
});

test('i decimali non si perdono: 10% di 5 Robux resta mezzo Robux', async () => {
  const { app, roblox, game, key } = createTestApp();
  const { token } = await linkAccount(app, roblox);
  await startPlaySession({ app, key, game, token });

  for (let i = 0; i < 4; i += 1) {
    await gameRequest(app, key, {
      path: '/v1/game/purchase',
      body: { receiptId: `rcpt-small-${i}`, robloxUserId: 4242, productId: 3, robuxSpent: 5 }
    });
  }
  const wallet = await playerRequest(app, { path: '/v1/wallet', token });
  assert.equal(wallet.body.pendingRobux, 2); // 4 x 0,5 Robux
});

test('lo storno di un acquisto riporta il ledger a zero sul cliente', async () => {
  const { app, roblox, game, key } = createTestApp();
  const { token, user } = await linkAccount(app, roblox);
  await startPlaySession({ app, key, game, token });

  const purchase = await gameRequest(app, key, {
    path: '/v1/game/purchase',
    body: { receiptId: 'rcpt-refund', robloxUserId: 4242, productId: 9, robuxSpent: 1000 }
  });
  assert.equal(ledger.balance(app.db, ledger.userAccount(user.id, 'pending')), 100 * MRBX);

  const reversal = await adminRequest(app, {
    method: 'POST',
    path: `/v1/admin/purchases/${purchase.body.purchaseId}/reverse`,
    body: { reason: 'chargeback' }
  });
  assert.equal(reversal.body.reversed, true);
  assert.equal(ledger.balance(app.db, ledger.userAccount(user.id, 'pending')), 0);
  assert.equal(ledger.balance(app.db, 'platform:revenue'), 0);
  assert.equal(ledger.trialBalance(app.db).balanced, true);
});
