import { config } from '../config.js';
import { now } from '../util/clock.js';
import { randomId } from '../util/crypto.js';
import { isNewRobloxAccount } from './accounts.js';

export const recordRiskEvent = (ctx, { userId = null, gameId = null, kind, severity = 'info', detail = null }) => {
  ctx.db
    .prepare('INSERT INTO risk_events (id, user_id, game_id, kind, severity, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(randomId('risk'), userId, gameId, kind, severity, detail ? JSON.stringify(detail) : null, now());
};

const cashbackLast24h = (ctx, userId) => {
  const row = ctx.db
    .prepare(
      `SELECT COALESCE(SUM(amount_mrbx), 0) AS total FROM cashback_awards
       WHERE user_id = ? AND state != 'reversed' AND created_at >= ?`
    )
    .get(userId, now() - 86_400_000);
  return row.total;
};

const purchasesInSession = (ctx, sessionId) =>
  ctx.db.prepare('SELECT COUNT(*) AS n FROM purchases WHERE session_id = ?').get(sessionId).n;

/**
 * Decide se un acquisto attribuito matura cashback subito, va in revisione
 * manuale o viene bloccato. Restituisce sempre una decisione motivata: le
 * regole sono deliberatamente conservative perché il cashback è denaro reale.
 */
export const assessPurchase = (ctx, { user, game, session, grossMrbx, cashbackMrbx }) => {
  const reasons = [];
  let decision = 'award';
  let holdMs = config.holdMs;

  if (user.status === 'suspended') {
    return { decision: 'block', holdMs, reasons: ['account_suspended'] };
  }
  if (user.status === 'review') {
    decision = 'review';
    reasons.push('account_under_review');
  }
  if (isNewRobloxAccount(user)) {
    holdMs = config.extendedHoldMs;
    reasons.push('new_roblox_account');
  }
  if (grossMrbx >= config.risk.manualReviewPurchaseMrbx) {
    decision = 'review';
    reasons.push('large_purchase');
  }
  if (cashbackLast24h(ctx, user.id) + cashbackMrbx > config.risk.maxCashbackPerDayMrbx) {
    decision = 'review';
    reasons.push('daily_cashback_cap');
  }
  if (session && purchasesInSession(ctx, session.id) >= config.risk.maxPurchasesPerSession) {
    decision = 'review';
    reasons.push('session_purchase_velocity');
  }

  if (decision !== 'award') {
    recordRiskEvent(ctx, {
      userId: user.id,
      gameId: game.id,
      kind: `purchase_${decision}`,
      severity: decision === 'block' ? 'block' : 'warn',
      detail: { reasons, grossMrbx, cashbackMrbx }
    });
  }
  return { decision, holdMs, reasons };
};
