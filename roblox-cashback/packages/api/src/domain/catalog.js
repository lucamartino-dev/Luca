import { config } from '../config.js';
import { now } from '../util/clock.js';
import { randomId, randomToken } from '../util/crypto.js';
import { conflict, notFound } from '../util/errors.js';

export const createPartner = (ctx, { name, contactEmail = null, commissionBps = config.defaultCommissionBps }) => {
  const id = randomId('prt');
  ctx.db
    .prepare('INSERT INTO partners (id, name, contact_email, commission_bps, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, name, contactEmail, commissionBps, now());
  return ctx.db.prepare('SELECT * FROM partners WHERE id = ?').get(id);
};

export const createGame = (ctx, partnerId, { placeId, universeId = null, name, description = null, iconUrl = null, cashbackBps = config.defaultCashbackBps }) => {
  const partner = ctx.db.prepare('SELECT * FROM partners WHERE id = ?').get(partnerId);
  if (!partner) throw notFound('partner_not_found', 'Partner inesistente');
  if (ctx.db.prepare('SELECT id FROM games WHERE place_id = ?').get(placeId)) {
    throw conflict('place_already_registered', 'Questo placeId è già registrato');
  }
  const id = randomId('gam');
  ctx.db
    .prepare(
      `INSERT INTO games (id, partner_id, place_id, universe_id, name, description, icon_url, cashback_bps, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, partnerId, placeId, universeId, name, description, iconUrl, cashbackBps, now());
  return ctx.db.prepare('SELECT * FROM games WHERE id = ?').get(id);
};

/** Genera una nuova chiave HMAC per il gioco e revoca quelle precedenti. */
export const issueGameKey = (ctx, gameId) => {
  const game = ctx.db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
  if (!game) throw notFound('game_not_found', 'Gioco inesistente');
  ctx.db.prepare('UPDATE game_keys SET revoked_at = ? WHERE game_id = ? AND revoked_at IS NULL').run(now(), gameId);
  const keyId = randomId('key');
  const secret = randomToken(32);
  ctx.db
    .prepare('INSERT INTO game_keys (key_id, game_id, secret, created_at) VALUES (?, ?, ?, ?)')
    .run(keyId, gameId, secret, now());
  return { keyId, secret, gameId, placeId: game.place_id };
};

export const listGames = (ctx) =>
  ctx.db
    .prepare(
      `SELECT g.*, p.name AS partner_name FROM games g
       JOIN partners p ON p.id = g.partner_id
       WHERE g.status = 'active' AND p.status = 'active'
       ORDER BY g.name`
    )
    .all();

export const getGame = (ctx, gameId) => {
  const game = ctx.db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
  if (!game) throw notFound('game_not_found', 'Gioco inesistente');
  return game;
};

export const publicGame = (game) => ({
  id: game.id,
  placeId: game.place_id,
  name: game.name,
  description: game.description,
  iconUrl: game.icon_url,
  cashbackPercent: game.cashback_bps / 100,
  partner: game.partner_name ?? undefined,
  status: game.status
});
