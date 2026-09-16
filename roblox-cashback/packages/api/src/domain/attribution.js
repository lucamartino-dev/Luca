import { config } from '../config.js';
import { now } from '../util/clock.js';
import { randomId, randomToken, sha256 } from '../util/crypto.js';
import { badRequest, forbidden } from '../util/errors.js';
import { getGame } from './catalog.js';

/**
 * L'app crea un "launch intent" e passa il token dentro il deep link Roblox.
 * Il server del gioco legge `Player:GetJoinData().LaunchData` e lo riscatta:
 * è così che sappiamo che quella partita arriva dalla nostra app.
 */
export const createLaunchIntent = (ctx, user, gameId, { clientIp = null, deviceId = null } = {}) => {
  const game = getGame(ctx, gameId);
  if (game.status !== 'active') throw badRequest('game_paused', 'Gioco non attivo nel programma');

  const token = randomToken(24);
  const timestamp = now();
  const id = randomId('li');
  ctx.db
    .prepare(
      `INSERT INTO launch_intents (id, user_id, game_id, token_hash, created_at, expires_at, client_ip, device_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, user.id, game.id, sha256(token), timestamp, timestamp + config.launchTokenTtlMs, clientIp, deviceId);

  const launchData = encodeURIComponent(token);
  return {
    intentId: id,
    token,
    expiresAt: timestamp + config.launchTokenTtlMs,
    game: { id: game.id, placeId: game.place_id, name: game.name, cashbackPercent: game.cashback_bps / 100 },
    // Deep link per l'app Roblox installata (iOS, Android, desktop).
    deepLink: `roblox://placeId=${game.place_id}&launchData=${launchData}`,
    // Fallback web: apre la pagina del gioco e passa lo stesso launchData.
    webLink: `https://www.roblox.com/games/start?placeId=${game.place_id}&launchData=${launchData}`
  };
};

const openSession = (ctx, { userId, gameId, intentId, jobId, source }) => {
  const timestamp = now();
  const id = randomId('ps');
  ctx.db
    .prepare(
      `INSERT INTO play_sessions (id, user_id, game_id, intent_id, job_id, source, started_at, expires_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, userId, gameId, intentId, jobId, source, timestamp, timestamp + config.sessionTtlMs, timestamp);
  return ctx.db.prepare('SELECT * FROM play_sessions WHERE id = ?').get(id);
};

/** Chiamata dal server di gioco quando un giocatore entra con un launchData valido. */
export const redeemLaunchToken = (ctx, game, { token, robloxUserId, jobId = null }) => {
  const intent = ctx.db.prepare('SELECT * FROM launch_intents WHERE token_hash = ?').get(sha256(String(token ?? '')));
  if (!intent) throw badRequest('invalid_launch_token', 'Launch token sconosciuto');
  if (intent.game_id !== game.id) throw forbidden('token_game_mismatch', 'Il token appartiene a un altro gioco');
  if (intent.expires_at < now()) throw badRequest('launch_token_expired', 'Launch token scaduto');

  const user = ctx.db.prepare('SELECT * FROM users WHERE id = ?').get(intent.user_id);
  if (!user) throw badRequest('user_not_found', 'Utente inesistente');
  if (user.status === 'suspended') throw forbidden('account_suspended', 'Account sospeso');
  if (Number(user.roblox_user_id) !== Number(robloxUserId)) {
    // Token condiviso o rubato: l'utente Roblox che entra non è quello che ha creato il link.
    recordTokenMismatch(ctx, user, game, robloxUserId);
    throw forbidden('token_user_mismatch', 'Il token appartiene a un altro utente Roblox');
  }

  const existing = ctx.db
    .prepare("SELECT * FROM play_sessions WHERE intent_id = ? AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1")
    .get(intent.id);
  if (existing) {
    touchSession(ctx, existing.id);
    return { session: existing, user, reused: true };
  }

  if (!intent.consumed_at) {
    ctx.db.prepare('UPDATE launch_intents SET consumed_at = ? WHERE id = ?').run(now(), intent.id);
  }
  const session = openSession(ctx, {
    userId: user.id,
    gameId: game.id,
    intentId: intent.id,
    jobId,
    source: 'launch_token'
  });
  return { session, user, reused: false };
};

const recordTokenMismatch = (ctx, user, game, robloxUserId) => {
  ctx.db
    .prepare('INSERT INTO risk_events (id, user_id, game_id, kind, severity, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(
      randomId('risk'),
      user.id,
      game.id,
      'launch_token_user_mismatch',
      'warn',
      JSON.stringify({ expected: user.roblox_user_id, got: robloxUserId }),
      now()
    );
};

/**
 * Fallback quando il deep link non propaga il launchData (succede su alcune
 * piattaforme): se l'utente ha creato un intent recente per questo gioco,
 * lo consideriamo attribuito.
 */
export const attributeByRecentIntent = (ctx, game, robloxUserId, { jobId = null } = {}) => {
  const user = ctx.db.prepare('SELECT * FROM users WHERE roblox_user_id = ?').get(Number(robloxUserId));
  if (!user) return null;
  if (user.status === 'suspended') return null;

  const intent = ctx.db
    .prepare(
      `SELECT * FROM launch_intents
       WHERE user_id = ? AND game_id = ? AND created_at >= ?
       ORDER BY created_at DESC LIMIT 1`
    )
    .get(user.id, game.id, now() - config.launchTokenTtlMs);
  if (!intent) return null;

  const open = ctx.db
    .prepare("SELECT * FROM play_sessions WHERE intent_id = ? AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1")
    .get(intent.id);
  if (open) {
    touchSession(ctx, open.id);
    return { session: open, user, reused: true };
  }
  const session = openSession(ctx, {
    userId: user.id,
    gameId: game.id,
    intentId: intent.id,
    jobId,
    source: 'recent_intent'
  });
  return { session, user, reused: false };
};

export const touchSession = (ctx, sessionId) => {
  const timestamp = now();
  ctx.db
    .prepare('UPDATE play_sessions SET last_seen_at = ?, expires_at = ? WHERE id = ? AND ended_at IS NULL')
    .run(timestamp, timestamp + config.sessionTtlMs, sessionId);
};

export const endSession = (ctx, sessionId) => {
  ctx.db.prepare('UPDATE play_sessions SET ended_at = ? WHERE id = ? AND ended_at IS NULL').run(now(), sessionId);
};

/** Sessione valida per attribuire un acquisto: stessa partita, non scaduta. */
export const findActiveSession = (ctx, game, robloxUserId) => {
  const user = ctx.db.prepare('SELECT * FROM users WHERE roblox_user_id = ?').get(Number(robloxUserId));
  if (!user) return null;
  const session = ctx.db
    .prepare(
      `SELECT * FROM play_sessions
       WHERE user_id = ? AND game_id = ? AND expires_at >= ?
       ORDER BY started_at DESC LIMIT 1`
    )
    .get(user.id, game.id, now());
  if (!session) return null;
  return { session, user };
};
