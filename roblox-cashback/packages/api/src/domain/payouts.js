import { config, MRBX } from '../config.js';
import { now } from '../util/clock.js';
import { randomId } from '../util/crypto.js';
import { badRequest, conflict, notFound } from '../util/errors.js';
import { transaction } from '../db/index.js';
import * as ledger from './ledger.js';

const METHODS = new Set(['group_payout', 'gift_card']);

/**
 * L'utente chiede di incassare il cashback. I fondi passano da "available" a
 * "reserved" subito, così una seconda richiesta non può spendere lo stesso saldo.
 */
export const requestPayout = (ctx, user, { amountRobux, method, destination = null }) => {
  if (!METHODS.has(method)) throw badRequest('invalid_method', 'Metodo di payout non supportato');
  if (!Number.isInteger(amountRobux) || amountRobux < config.payout.minRobux) {
    throw badRequest('amount_too_small', `Il minimo riscattabile è ${config.payout.minRobux} Robux`);
  }
  if (user.status !== 'active') throw badRequest('account_not_active', 'Account non abilitato ai payout');

  const pending = ctx.db
    .prepare("SELECT COUNT(*) AS n FROM payout_requests WHERE user_id = ? AND state IN ('requested','approved')")
    .get(user.id).n;
  if (pending >= config.payout.maxPendingRequests) {
    throw conflict('too_many_pending', 'Hai già troppe richieste di payout in corso');
  }

  const amountMrbx = amountRobux * MRBX;
  return transaction(ctx.db, () => {
    const available = ledger.balance(ctx.db, ledger.userAccount(user.id, 'available'));
    if (available < amountMrbx) {
      throw badRequest('insufficient_balance', 'Saldo riscattabile insufficiente', {
        availableRobux: available / MRBX
      });
    }
    const id = randomId('pay');
    ctx.db
      .prepare(
        `INSERT INTO payout_requests (id, user_id, amount_mrbx, method, destination, state, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'requested', ?, ?)`
      )
      .run(id, user.id, amountMrbx, method, destination, now(), now());

    ledger.post(ctx.db, {
      kind: 'payout_reserve',
      refType: 'payout',
      refId: id,
      memo: `Richiesta payout ${method}`,
      entries: [
        { account: ledger.userAccount(user.id, 'available'), direction: 'debit', amount: amountMrbx },
        { account: ledger.userAccount(user.id, 'reserved'), direction: 'credit', amount: amountMrbx }
      ]
    });
    return ctx.db.prepare('SELECT * FROM payout_requests WHERE id = ?').get(id);
  });
};

const load = (ctx, payoutId) => {
  const payout = ctx.db.prepare('SELECT * FROM payout_requests WHERE id = ?').get(payoutId);
  if (!payout) throw notFound('payout_not_found', 'Richiesta di payout inesistente');
  return payout;
};

export const approvePayout = (ctx, payoutId) => {
  const payout = load(ctx, payoutId);
  if (payout.state !== 'requested') throw conflict('invalid_state', `Payout in stato ${payout.state}`);
  ctx.db.prepare("UPDATE payout_requests SET state = 'approved', updated_at = ? WHERE id = ?").run(now(), payoutId);
  return load(ctx, payoutId);
};

/** Il payout è stato eseguito fuori piattaforma: qui lo registriamo in contabilità. */
export const fulfillPayout = (ctx, payoutId, externalRef) => {
  return transaction(ctx.db, () => {
    const payout = load(ctx, payoutId);
    if (payout.state !== 'approved') throw conflict('invalid_state', `Payout in stato ${payout.state}`);
    ctx.db
      .prepare("UPDATE payout_requests SET state = 'fulfilled', external_ref = ?, updated_at = ? WHERE id = ?")
      .run(externalRef ?? null, now(), payoutId);
    ledger.post(ctx.db, {
      kind: 'payout_fulfilled',
      refType: 'payout',
      refId: payoutId,
      memo: externalRef ?? null,
      entries: [
        { account: ledger.userAccount(payout.user_id, 'reserved'), direction: 'debit', amount: payout.amount_mrbx },
        { account: 'platform:payout_float', direction: 'credit', amount: payout.amount_mrbx }
      ]
    });
    return load(ctx, payoutId);
  });
};

/** Rifiuto o annullamento: i fondi riservati tornano disponibili. */
export const releasePayout = (ctx, payoutId, { state, reason = null }) => {
  return transaction(ctx.db, () => {
    const payout = load(ctx, payoutId);
    if (!['requested', 'approved'].includes(payout.state)) {
      throw conflict('invalid_state', `Payout in stato ${payout.state}`);
    }
    ctx.db
      .prepare('UPDATE payout_requests SET state = ?, failure_reason = ?, updated_at = ? WHERE id = ?')
      .run(state, reason, now(), payoutId);
    ledger.post(ctx.db, {
      kind: state === 'rejected' ? 'payout_rejected' : 'payout_cancelled',
      refType: 'payout',
      refId: payoutId,
      memo: reason,
      entries: [
        { account: ledger.userAccount(payout.user_id, 'reserved'), direction: 'debit', amount: payout.amount_mrbx },
        { account: ledger.userAccount(payout.user_id, 'available'), direction: 'credit', amount: payout.amount_mrbx }
      ]
    });
    return load(ctx, payoutId);
  });
};

export const publicPayout = (payout) => ({
  id: payout.id,
  amountRobux: payout.amount_mrbx / MRBX,
  method: payout.method,
  destination: payout.destination,
  state: payout.state,
  createdAt: payout.created_at,
  updatedAt: payout.updated_at,
  externalRef: payout.external_ref,
  failureReason: payout.failure_reason
});
