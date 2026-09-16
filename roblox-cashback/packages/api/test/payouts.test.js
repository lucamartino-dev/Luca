import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestApp, gameRequest, playerRequest, adminRequest, linkAccount, startPlaySession } from './helpers.js';
import { advanceClock, resetClock } from '../src/util/clock.js';
import * as ledger from '../src/domain/ledger.js';
import { config, MRBX } from '../src/config.js';

test.afterEach(() => resetClock());

/** Porta un utente ad avere `robux` di cashback riscattabile. */
const earnAndSettle = async ({ app, roblox, game, key }, spentRobux = 5000) => {
  const { token, user } = await linkAccount(app, roblox);
  await startPlaySession({ app, key, game, token });
  await gameRequest(app, key, {
    path: '/v1/game/purchase',
    body: { receiptId: `rcpt-${spentRobux}`, robloxUserId: 4242, productId: 1, robuxSpent: spentRobux }
  });
  advanceClock(config.extendedHoldMs + 1000);
  await adminRequest(app, { method: 'POST', path: '/v1/admin/settle' });
  return { token, user };
};

test('richiesta di payout: il saldo passa da disponibile a riservato', async () => {
  const fixture = createTestApp();
  const { app } = fixture;
  const { token, user } = await earnAndSettle(fixture, 4000); // 400 Robux di cashback

  const payout = await playerRequest(app, {
    method: 'POST',
    path: '/v1/payouts',
    token,
    body: { amountRobux: 300, method: 'group_payout', destination: 'gruppo 12345' }
  });
  assert.equal(payout.status, 201);
  assert.equal(payout.body.state, 'requested');

  assert.equal(ledger.balance(app.db, ledger.userAccount(user.id, 'available')), 100 * MRBX);
  assert.equal(ledger.balance(app.db, ledger.userAccount(user.id, 'reserved')), 300 * MRBX);

  const wallet = await playerRequest(app, { path: '/v1/wallet', token });
  assert.equal(wallet.body.availableRobux, 100);
  assert.equal(wallet.body.reservedRobux, 300);
});

test('non si può chiedere più del saldo disponibile, nemmeno con due richieste', async () => {
  const fixture = createTestApp();
  const { app } = fixture;
  const { token } = await earnAndSettle(fixture, 2000); // 200 Robux

  const first = await playerRequest(app, {
    method: 'POST',
    path: '/v1/payouts',
    token,
    body: { amountRobux: 150, method: 'gift_card', destination: 'luca@example.com' }
  });
  assert.equal(first.status, 201);

  const second = await playerRequest(app, {
    method: 'POST',
    path: '/v1/payouts',
    token,
    body: { amountRobux: 150, method: 'gift_card', destination: 'luca@example.com' }
  });
  assert.equal(second.status, 400);
  assert.equal(second.body.error, 'insufficient_balance');
});

test('sotto il minimo la richiesta viene rifiutata', async () => {
  const fixture = createTestApp();
  const { app } = fixture;
  const { token } = await earnAndSettle(fixture, 5000);
  const result = await playerRequest(app, {
    method: 'POST',
    path: '/v1/payouts',
    token,
    body: { amountRobux: config.payout.minRobux - 1, method: 'group_payout' }
  });
  assert.equal(result.status, 400);
  assert.equal(result.body.error, 'amount_too_small');
});

test('approvazione ed esecuzione scaricano il riservato sul float di piattaforma', async () => {
  const fixture = createTestApp();
  const { app } = fixture;
  const { token, user } = await earnAndSettle(fixture, 3000); // 300 Robux

  const payout = await playerRequest(app, {
    method: 'POST',
    path: '/v1/payouts',
    token,
    body: { amountRobux: 300, method: 'group_payout', destination: 'gruppo 12345' }
  });
  await adminRequest(app, { method: 'POST', path: `/v1/admin/payouts/${payout.body.id}/approve` });
  const fulfilled = await adminRequest(app, {
    method: 'POST',
    path: `/v1/admin/payouts/${payout.body.id}/fulfill`,
    body: { externalRef: 'group-payout-8891' }
  });

  assert.equal(fulfilled.body.state, 'fulfilled');
  assert.equal(ledger.balance(app.db, ledger.userAccount(user.id, 'reserved')), 0);
  assert.equal(ledger.balance(app.db, 'platform:payout_float'), -300 * MRBX);
  assert.equal(ledger.trialBalance(app.db).balanced, true);
});

test('annullando la richiesta il saldo torna disponibile', async () => {
  const fixture = createTestApp();
  const { app } = fixture;
  const { token, user } = await earnAndSettle(fixture, 2000);

  const payout = await playerRequest(app, {
    method: 'POST',
    path: '/v1/payouts',
    token,
    body: { amountRobux: 200, method: 'gift_card', destination: 'luca@example.com' }
  });
  await playerRequest(app, { method: 'POST', path: `/v1/payouts/${payout.body.id}/cancel`, token });

  assert.equal(ledger.balance(app.db, ledger.userAccount(user.id, 'available')), 200 * MRBX);
  assert.equal(ledger.balance(app.db, ledger.userAccount(user.id, 'reserved')), 0);
});

test('un payout già eseguito non si può annullare', async () => {
  const fixture = createTestApp();
  const { app } = fixture;
  const { token } = await earnAndSettle(fixture, 3000);
  const payout = await playerRequest(app, {
    method: 'POST',
    path: '/v1/payouts',
    token,
    body: { amountRobux: 300, method: 'group_payout' }
  });
  await adminRequest(app, { method: 'POST', path: `/v1/admin/payouts/${payout.body.id}/approve` });
  await adminRequest(app, { method: 'POST', path: `/v1/admin/payouts/${payout.body.id}/fulfill`, body: {} });

  const cancel = await playerRequest(app, { method: 'POST', path: `/v1/payouts/${payout.body.id}/cancel`, token });
  assert.equal(cancel.status, 409);
});

test('il payout di un altro utente non è toccabile', async () => {
  const fixture = createTestApp({
    robloxUsers: [{ robloxUserId: 555, username: 'Altra', displayName: 'Altra' }]
  });
  const { app, roblox } = fixture;
  const { token } = await earnAndSettle(fixture, 2000);
  const payout = await playerRequest(app, {
    method: 'POST',
    path: '/v1/payouts',
    token,
    body: { amountRobux: 200, method: 'gift_card' }
  });

  const other = await linkAccount(app, roblox, 'Altra');
  const attempt = await playerRequest(app, {
    method: 'POST',
    path: `/v1/payouts/${payout.body.id}/cancel`,
    token: other.token
  });
  assert.equal(attempt.status, 403);
});
