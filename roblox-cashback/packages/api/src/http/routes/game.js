import { MRBX } from '../../config.js';
import { attributeByRecentIntent, endSession, redeemLaunchToken, touchSession } from '../../domain/attribution.js';
import { ingestPurchase } from '../../domain/purchases.js';
import { verifyGameRequest } from '../signature.js';
import { badRequest } from '../../util/errors.js';

/** Rotte chiamate da HttpService dentro i giochi partner. Tutte firmate in HMAC. */
export const registerGameRoutes = (router, ctx) => {
  const authed = (handler) => async (req) => {
    const { game } = verifyGameRequest(ctx, {
      method: req.method,
      path: req.pathname,
      rawBody: req.rawBody,
      headers: req.headers
    });
    return handler(req, game);
  };

  router.get('/v1/game/config', authed(async (_req, game) => ({
    status: 200,
    body: {
      gameId: game.id,
      placeId: game.place_id,
      name: game.name,
      cashbackPercent: game.cashback_bps / 100,
      status: game.status
    }
  })));

  router.post(
    '/v1/game/session/attribute',
    authed(async (req, game) => {
      const robloxUserId = Number(req.body?.robloxUserId);
      if (!Number.isFinite(robloxUserId)) throw badRequest('invalid_user', 'robloxUserId non valido');
      const jobId = req.body?.jobId ?? null;

      if (req.body?.launchToken) {
        const { session, user, reused } = redeemLaunchToken(ctx, game, {
          token: req.body.launchToken,
          robloxUserId,
          jobId
        });
        return {
          status: 200,
          body: {
            attributed: true,
            reused,
            sessionId: session.id,
            source: session.source,
            expiresAt: session.expires_at,
            cashbackPercent: game.cashback_bps / 100,
            username: user.roblox_username
          }
        };
      }

      const fallback = attributeByRecentIntent(ctx, game, robloxUserId, { jobId });
      if (!fallback) {
        return { status: 200, body: { attributed: false, reason: 'no_recent_intent' } };
      }
      return {
        status: 200,
        body: {
          attributed: true,
          reused: fallback.reused,
          sessionId: fallback.session.id,
          source: fallback.session.source,
          expiresAt: fallback.session.expires_at,
          cashbackPercent: game.cashback_bps / 100,
          username: fallback.user.roblox_username
        }
      };
    })
  );

  router.post(
    '/v1/game/session/heartbeat',
    authed(async (req) => {
      touchSession(ctx, String(req.body?.sessionId ?? ''));
      return { status: 204, body: null };
    })
  );

  router.post(
    '/v1/game/session/end',
    authed(async (req) => {
      endSession(ctx, String(req.body?.sessionId ?? ''));
      return { status: 204, body: null };
    })
  );

  router.post(
    '/v1/game/purchase',
    authed(async (req, game) => {
      const result = ingestPurchase(ctx, game, {
        receiptId: req.body?.receiptId,
        robloxUserId: req.body?.robloxUserId,
        productId: req.body?.productId,
        productName: req.body?.productName ?? null,
        robuxSpent: Number(req.body?.robuxSpent),
        purchasedAt: req.body?.purchasedAt
      });
      return {
        status: result.duplicate ? 200 : 201,
        body: {
          duplicate: result.duplicate,
          purchaseId: result.purchase.id,
          status: result.purchase.status,
          reason: result.purchase.status_reason,
          cashbackRobux: result.award ? result.award.amount_mrbx / MRBX : 0,
          availableFrom: result.award ? result.award.hold_until : null
        }
      };
    })
  );
};
