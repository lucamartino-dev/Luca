import { config, MRBX } from '../../config.js';
import { now } from '../../util/clock.js';
import { randomId, safeEqual } from '../../util/crypto.js';
import { unauthorized } from '../../util/errors.js';
import { createGame, createPartner, issueGameKey } from '../../domain/catalog.js';
import { reversePurchase, settleMaturedAwards } from '../../domain/purchases.js';
import { approvePayout, fulfillPayout, publicPayout, releasePayout } from '../../domain/payouts.js';
import * as ledger from '../../domain/ledger.js';

const audit = (ctx, action, target, detail) => {
  ctx.db
    .prepare('INSERT INTO audit_log (id, actor, action, target, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(randomId('aud'), 'admin', action, target ?? null, detail ? JSON.stringify(detail) : null, now());
};

export const registerAdminRoutes = (router, ctx) => {
  const authed = (handler) => async (req) => {
    const token = req.headers['x-admin-token'];
    if (!token || !safeEqual(String(token), config.adminToken)) throw unauthorized('bad_admin_token', 'Token admin non valido');
    return handler(req);
  };

  router.post(
    '/v1/admin/partners',
    authed(async (req) => {
      const partner = createPartner(ctx, {
        name: req.body?.name,
        contactEmail: req.body?.contactEmail ?? null,
        commissionBps: Number(req.body?.commissionBps ?? config.defaultCommissionBps)
      });
      audit(ctx, 'partner.create', partner.id, { name: partner.name });
      return { status: 201, body: partner };
    })
  );

  router.post(
    '/v1/admin/partners/:id/games',
    authed(async (req) => {
      const game = createGame(ctx, req.params.id, {
        placeId: Number(req.body?.placeId),
        universeId: req.body?.universeId ? Number(req.body.universeId) : null,
        name: req.body?.name,
        description: req.body?.description ?? null,
        iconUrl: req.body?.iconUrl ?? null,
        cashbackBps: Number(req.body?.cashbackBps ?? config.defaultCashbackBps)
      });
      audit(ctx, 'game.create', game.id, { placeId: game.place_id });
      return { status: 201, body: game };
    })
  );

  router.post(
    '/v1/admin/games/:id/keys',
    authed(async (req) => {
      const key = issueGameKey(ctx, req.params.id);
      audit(ctx, 'game.key.issue', req.params.id, { keyId: key.keyId });
      // Il segreto viene mostrato una sola volta: va messo in HttpService:GetSecret().
      return { status: 201, body: key };
    })
  );

  router.post(
    '/v1/admin/settle',
    authed(async () => ({ status: 200, body: settleMaturedAwards(ctx) }))
  );

  router.post(
    '/v1/admin/purchases/:id/reverse',
    authed(async (req) => {
      const result = reversePurchase(ctx, req.params.id, req.body?.reason ?? 'refund');
      audit(ctx, 'purchase.reverse', req.params.id, { reason: req.body?.reason ?? 'refund' });
      return { status: 200, body: result };
    })
  );

  router.get(
    '/v1/admin/payouts',
    authed(async (req) => {
      const state = req.query.state ?? 'requested';
      const rows = ctx.db
        .prepare('SELECT * FROM payout_requests WHERE state = ? ORDER BY created_at LIMIT 200')
        .all(state);
      return { status: 200, body: { items: rows.map(publicPayout) } };
    })
  );

  router.post(
    '/v1/admin/payouts/:id/approve',
    authed(async (req) => {
      audit(ctx, 'payout.approve', req.params.id, null);
      return { status: 200, body: publicPayout(approvePayout(ctx, req.params.id)) };
    })
  );

  router.post(
    '/v1/admin/payouts/:id/fulfill',
    authed(async (req) => {
      audit(ctx, 'payout.fulfill', req.params.id, { externalRef: req.body?.externalRef ?? null });
      return { status: 200, body: publicPayout(fulfillPayout(ctx, req.params.id, req.body?.externalRef ?? null)) };
    })
  );

  router.post(
    '/v1/admin/payouts/:id/reject',
    authed(async (req) => {
      audit(ctx, 'payout.reject', req.params.id, { reason: req.body?.reason ?? null });
      return {
        status: 200,
        body: publicPayout(releasePayout(ctx, req.params.id, { state: 'rejected', reason: req.body?.reason ?? null }))
      };
    })
  );

  router.get(
    '/v1/admin/ledger/trial-balance',
    authed(async () => {
      const accounts = ctx.db.prepare('SELECT name FROM ledger_accounts ORDER BY name').all();
      return {
        status: 200,
        body: {
          ...ledger.trialBalance(ctx.db),
          accounts: accounts.map((row) => ({
            account: row.name,
            balanceRobux: ledger.balance(ctx.db, row.name) / MRBX
          }))
        }
      };
    })
  );

  // Scorciatoia di sviluppo: simula l'utente che incolla il codice nella bio.
  // Esiste solo quando il client Roblox è quello finto (RBX_MODE=mock).
  router.post(
    '/v1/admin/dev/mock-bio',
    authed(async (req) => {
      if (!ctx.roblox._mock) throw unauthorized('not_in_mock_mode', 'Disponibile solo con RBX_MODE=mock');
      ctx.roblox.setDescription(Number(req.body?.robloxUserId), String(req.body?.description ?? ''));
      return { status: 204, body: null };
    })
  );

  router.get(
    '/v1/admin/stats',
    authed(async () => {
      const row = (sql, ...args) => ctx.db.prepare(sql).get(...args);
      const attributed = row(
        `SELECT COUNT(*) AS n, COALESCE(SUM(gross_mrbx), 0) AS gross FROM purchases WHERE status IN ('awarded','review')`
      );
      const unattributed = row("SELECT COUNT(*) AS n FROM purchases WHERE status = 'unattributed'");
      const awards = row(
        `SELECT COALESCE(SUM(CASE WHEN state = 'pending' THEN amount_mrbx END), 0) AS pending,
                COALESCE(SUM(CASE WHEN state = 'available' THEN amount_mrbx END), 0) AS available,
                COALESCE(SUM(CASE WHEN state = 'reversed' THEN amount_mrbx END), 0) AS reversed
         FROM cashback_awards`
      );
      return {
        status: 200,
        body: {
          users: row('SELECT COUNT(*) AS n FROM users').n,
          games: row('SELECT COUNT(*) AS n FROM games').n,
          attributedPurchases: attributed.n,
          attributedGrossRobux: attributed.gross / MRBX,
          unattributedPurchases: unattributed.n,
          cashbackPendingRobux: awards.pending / MRBX,
          cashbackAvailableRobux: awards.available / MRBX,
          cashbackReversedRobux: awards.reversed / MRBX,
          platformRevenueRobux: ledger.balance(ctx.db, 'platform:revenue') / MRBX
        }
      };
    })
  );
};
