import { config, MRBX } from '../../config.js';
import { authenticate, confirmVerification, publicUser, revokeSession, startVerification } from '../../domain/accounts.js';
import { listGames, publicGame } from '../../domain/catalog.js';
import { createLaunchIntent } from '../../domain/attribution.js';
import * as ledger from '../../domain/ledger.js';
import { publicPayout, releasePayout, requestPayout } from '../../domain/payouts.js';
import { forbidden } from '../../util/errors.js';

const robux = (mrbx) => Number((mrbx / MRBX).toFixed(3));

export const registerPlayerRoutes = (router, ctx) => {
  router.post('/v1/auth/start', async (req) => ({
    status: 200,
    body: await startVerification(ctx, req.body?.username)
  }));

  router.post('/v1/auth/confirm', async (req) => {
    const { user, session } = await confirmVerification(ctx, req.body?.challengeId);
    return { status: 200, body: { user: publicUser(user), token: session.token, expiresAt: session.expiresAt } };
  });

  router.post('/v1/auth/logout', async (req) => {
    const raw = String(req.headers.authorization ?? '');
    if (raw.startsWith('Bearer ')) revokeSession(ctx, raw.slice(7));
    return { status: 204, body: null };
  });

  router.get('/v1/me', async (req) => {
    const user = authenticate(ctx, req.headers.authorization);
    return { status: 200, body: { user: publicUser(user) } };
  });

  router.get('/v1/games', async () => ({
    status: 200,
    body: {
      defaultCashbackPercent: config.defaultCashbackBps / 100,
      games: listGames(ctx).map(publicGame)
    }
  }));

  router.post('/v1/games/:id/launch', async (req) => {
    const user = authenticate(ctx, req.headers.authorization);
    const intent = createLaunchIntent(ctx, user, req.params.id, {
      clientIp: req.ip,
      deviceId: req.headers['x-device-id'] ?? null
    });
    return { status: 201, body: intent };
  });

  router.get('/v1/wallet', async (req) => {
    const user = authenticate(ctx, req.headers.authorization);
    const balances = ledger.userBalances(ctx.db, user.id);
    const lifetime = ctx.db
      .prepare(
        `SELECT COALESCE(SUM(amount_mrbx), 0) AS earned FROM cashback_awards
         WHERE user_id = ? AND state != 'reversed'`
      )
      .get(user.id).earned;
    return {
      status: 200,
      body: {
        pendingRobux: robux(balances.pending),
        availableRobux: robux(balances.available),
        reservedRobux: robux(balances.reserved),
        lifetimeRobux: robux(lifetime),
        minPayoutRobux: config.payout.minRobux
      }
    };
  });

  router.get('/v1/wallet/activity', async (req) => {
    const user = authenticate(ctx, req.headers.authorization);
    const limit = Math.min(Number(req.query.limit ?? 50), 200);
    const awards = ctx.db
      .prepare(
        `SELECT a.id, a.amount_mrbx, a.state, a.hold_until, a.created_at,
                g.name AS game_name, p.gross_mrbx, p.product_name
         FROM cashback_awards a
         JOIN games g ON g.id = a.game_id
         JOIN purchases p ON p.id = a.purchase_id
         WHERE a.user_id = ? ORDER BY a.created_at DESC LIMIT ?`
      )
      .all(user.id, limit);
    return {
      status: 200,
      body: {
        items: awards.map((row) => ({
          id: row.id,
          type: 'cashback',
          game: row.game_name,
          product: row.product_name,
          spentRobux: robux(row.gross_mrbx),
          cashbackRobux: robux(row.amount_mrbx),
          state: row.state,
          availableFrom: row.hold_until,
          createdAt: row.created_at
        }))
      }
    };
  });

  router.get('/v1/payouts', async (req) => {
    const user = authenticate(ctx, req.headers.authorization);
    const rows = ctx.db
      .prepare('SELECT * FROM payout_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 50')
      .all(user.id);
    return { status: 200, body: { items: rows.map(publicPayout) } };
  });

  router.post('/v1/payouts', async (req) => {
    const user = authenticate(ctx, req.headers.authorization);
    const payout = requestPayout(ctx, user, {
      amountRobux: Number(req.body?.amountRobux),
      method: req.body?.method,
      destination: req.body?.destination ?? null
    });
    return { status: 201, body: publicPayout(payout) };
  });

  router.post('/v1/payouts/:id/cancel', async (req) => {
    const user = authenticate(ctx, req.headers.authorization);
    const payout = ctx.db.prepare('SELECT * FROM payout_requests WHERE id = ?').get(req.params.id);
    if (!payout || payout.user_id !== user.id) throw forbidden('not_your_payout', 'Richiesta non tua');
    return {
      status: 200,
      body: publicPayout(releasePayout(ctx, req.params.id, { state: 'cancelled', reason: 'annullato dall_utente' }))
    };
  });
};
