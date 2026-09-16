import { bps, config, MRBX } from '../config.js';
import { now } from '../util/clock.js';
import { randomId } from '../util/crypto.js';
import { badRequest } from '../util/errors.js';
import { transaction } from '../db/index.js';
import * as ledger from './ledger.js';
import { findActiveSession } from './attribution.js';
import { assessPurchase } from './risk.js';

const normalizeGross = (payload) => {
  if (Number.isInteger(payload.robuxSpent) && payload.robuxSpent > 0) return payload.robuxSpent * MRBX;
  throw badRequest('invalid_amount', 'robuxSpent deve essere un intero positivo');
};

/**
 * Ingestione di un acquisto notificato dal server di gioco (ProcessReceipt).
 * È idempotente sulla coppia (gioco, receiptId): Roblox può ritentare lo stesso
 * receipt molte volte e non dobbiamo mai pagare due volte lo stesso acquisto.
 */
export const ingestPurchase = (ctx, game, payload) => {
  const receiptId = String(payload.receiptId ?? '').trim();
  if (!receiptId) throw badRequest('missing_receipt', 'receiptId obbligatorio');
  const productId = Number(payload.productId);
  if (!Number.isFinite(productId)) throw badRequest('invalid_product', 'productId non valido');
  const robloxUserId = Number(payload.robloxUserId);
  if (!Number.isFinite(robloxUserId)) throw badRequest('invalid_user', 'robloxUserId non valido');

  const existing = ctx.db
    .prepare('SELECT * FROM purchases WHERE game_id = ? AND receipt_id = ?')
    .get(game.id, receiptId);
  if (existing) {
    const award = ctx.db.prepare('SELECT * FROM cashback_awards WHERE purchase_id = ?').get(existing.id);
    return { duplicate: true, purchase: existing, award: award ?? null };
  }

  const grossMrbx = normalizeGross(payload);
  const purchasedAt = Number.isFinite(Number(payload.purchasedAt)) ? Number(payload.purchasedAt) : now();
  const match = findActiveSession(ctx, game, robloxUserId);

  return transaction(ctx.db, () => {
    const purchaseId = randomId('pur');
    const insert = ctx.db.prepare(
      `INSERT INTO purchases (id, receipt_id, game_id, user_id, session_id, product_id, product_name,
                              gross_mrbx, purchased_at, received_at, status, status_reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    // Nessuna sessione attiva: il giocatore non è arrivato dalla nostra app,
    // quindi registriamo l'acquisto per le statistiche ma non paghiamo nulla.
    if (!match) {
      insert.run(
        purchaseId,
        receiptId,
        game.id,
        null,
        null,
        productId,
        payload.productName ?? null,
        grossMrbx,
        purchasedAt,
        now(),
        'unattributed',
        'no_active_session'
      );
      return {
        duplicate: false,
        purchase: ctx.db.prepare('SELECT * FROM purchases WHERE id = ?').get(purchaseId),
        award: null
      };
    }

    const { session, user } = match;
    const cashbackMrbx = bps(grossMrbx, game.cashback_bps);
    const commissionMrbx = bps(grossMrbx, ctx.partnerCommissionBps(game));
    const verdict = assessPurchase(ctx, { user, game, session, grossMrbx, cashbackMrbx });

    if (verdict.decision === 'block' || cashbackMrbx <= 0) {
      insert.run(
        purchaseId,
        receiptId,
        game.id,
        user.id,
        session.id,
        productId,
        payload.productName ?? null,
        grossMrbx,
        purchasedAt,
        now(),
        verdict.decision === 'block' ? 'reversed' : 'unattributed',
        verdict.reasons.join(',') || 'zero_cashback'
      );
      return {
        duplicate: false,
        purchase: ctx.db.prepare('SELECT * FROM purchases WHERE id = ?').get(purchaseId),
        award: null
      };
    }

    insert.run(
      purchaseId,
      receiptId,
      game.id,
      user.id,
      session.id,
      productId,
      payload.productName ?? null,
      grossMrbx,
      purchasedAt,
      now(),
      verdict.decision === 'review' ? 'review' : 'awarded',
      verdict.reasons.join(',') || null
    );

    const holdUntil = now() + (verdict.decision === 'review' ? config.extendedHoldMs : verdict.holdMs);
    const awardId = randomId('cbk');
    ctx.db
      .prepare(
        `INSERT INTO cashback_awards (id, purchase_id, user_id, game_id, amount_mrbx, state, hold_until, created_at)
         VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`
      )
      .run(awardId, purchaseId, user.id, game.id, cashbackMrbx, holdUntil, now());

    // Partita doppia: il partner ci deve la commissione, l'utente matura il
    // cashback come nostra passività, la differenza è margine.
    const entries = [
      { account: ledger.partnerAccount(game.partner_id), direction: 'debit', amount: commissionMrbx },
      { account: ledger.userAccount(user.id, 'pending'), direction: 'credit', amount: cashbackMrbx }
    ];
    const margin = commissionMrbx - cashbackMrbx;
    if (margin > 0) entries.push({ account: 'platform:revenue', direction: 'credit', amount: margin });
    else if (margin < 0) entries.push({ account: 'platform:revenue', direction: 'debit', amount: -margin });

    ledger.post(ctx.db, {
      kind: 'cashback_accrual',
      refType: 'purchase',
      refId: purchaseId,
      memo: `${game.name} · receipt ${receiptId}`,
      entries
    });

    return {
      duplicate: false,
      purchase: ctx.db.prepare('SELECT * FROM purchases WHERE id = ?').get(purchaseId),
      award: ctx.db.prepare('SELECT * FROM cashback_awards WHERE id = ?').get(awardId)
    };
  });
};

/** Sblocca i cashback il cui periodo di hold è terminato. Idempotente. */
export const settleMaturedAwards = (ctx, limit = 500) => {
  const due = ctx.db
    .prepare(
      `SELECT a.* FROM cashback_awards a
       JOIN purchases p ON p.id = a.purchase_id
       WHERE a.state = 'pending' AND a.hold_until <= ? AND p.status = 'awarded'
       ORDER BY a.hold_until LIMIT ?`
    )
    .all(now(), limit);

  let settled = 0;
  for (const award of due) {
    transaction(ctx.db, () => {
      const fresh = ctx.db.prepare("SELECT * FROM cashback_awards WHERE id = ? AND state = 'pending'").get(award.id);
      if (!fresh) return;
      ctx.db.prepare("UPDATE cashback_awards SET state = 'available', settled_at = ? WHERE id = ?").run(now(), award.id);
      ledger.post(ctx.db, {
        kind: 'cashback_settlement',
        refType: 'cashback_award',
        refId: award.id,
        memo: 'Fine periodo di hold',
        entries: [
          { account: ledger.userAccount(award.user_id, 'pending'), direction: 'debit', amount: award.amount_mrbx },
          { account: ledger.userAccount(award.user_id, 'available'), direction: 'credit', amount: award.amount_mrbx }
        ]
      });
      settled += 1;
    });
  }
  return { settled, scanned: due.length };
};

/**
 * Storno di un acquisto (rimborso Roblox, chargeback, frode accertata).
 * Funziona solo finché il cashback è ancora in hold: dopo lo sblocco il
 * recupero passa dal supporto, come documentato in docs/OPERATIONS.md.
 */
export const reversePurchase = (ctx, purchaseId, reason = 'refund') => {
  return transaction(ctx.db, () => {
    const purchase = ctx.db.prepare('SELECT * FROM purchases WHERE id = ?').get(purchaseId);
    if (!purchase) throw badRequest('purchase_not_found', 'Acquisto inesistente');
    if (purchase.status === 'reversed') return { reversed: false, reason: 'already_reversed' };

    const award = ctx.db.prepare('SELECT * FROM cashback_awards WHERE purchase_id = ?').get(purchaseId);
    ctx.db.prepare('UPDATE purchases SET status = ?, status_reason = ? WHERE id = ?').run('reversed', reason, purchaseId);
    if (!award || award.state === 'reversed') return { reversed: true, award: null };
    if (award.state !== 'pending') {
      return { reversed: true, award, needsManualRecovery: true };
    }

    const game = ctx.db.prepare('SELECT * FROM games WHERE id = ?').get(purchase.game_id);
    const commissionMrbx = bps(purchase.gross_mrbx, ctx.partnerCommissionBps(game));
    ctx.db.prepare("UPDATE cashback_awards SET state = 'reversed', settled_at = ? WHERE id = ?").run(now(), award.id);

    const entries = [
      { account: ledger.userAccount(award.user_id, 'pending'), direction: 'debit', amount: award.amount_mrbx },
      { account: ledger.partnerAccount(game.partner_id), direction: 'credit', amount: commissionMrbx }
    ];
    const margin = commissionMrbx - award.amount_mrbx;
    if (margin > 0) entries.push({ account: 'platform:revenue', direction: 'debit', amount: margin });
    else if (margin < 0) entries.push({ account: 'platform:revenue', direction: 'credit', amount: -margin });

    ledger.post(ctx.db, {
      kind: 'cashback_reversal',
      refType: 'purchase',
      refId: purchaseId,
      memo: reason,
      entries
    });
    return { reversed: true, award };
  });
};
