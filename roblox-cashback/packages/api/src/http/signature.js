import { config } from '../config.js';
import { now } from '../util/clock.js';
import { hmac, safeEqual, sha256 } from '../util/crypto.js';
import { forbidden, unauthorized } from '../util/errors.js';

/**
 * Le richieste dai server di gioco sono firmate in HMAC-SHA256.
 * Stringa firmata: `${timestamp}.${nonce}.${METHOD}.${path}.${sha256(body)}`.
 * Il nonce viene memorizzato per impedire i replay dentro la finestra di skew.
 */
export const signingString = ({ timestamp, nonce, method, path, body }) =>
  `${timestamp}.${nonce}.${method.toUpperCase()}.${path}.${sha256(body ?? '')}`;

export const sign = ({ secret, timestamp, nonce, method, path, body }) =>
  hmac(secret, signingString({ timestamp, nonce, method, path, body }));

export const verifySignedRequest = (ctx, { method, path, rawBody, headers }) => {
  const keyId = headers['x-cashback-key'];
  const timestamp = Number(headers['x-cashback-timestamp']);
  const nonce = headers['x-cashback-nonce'];
  const signature = headers['x-cashback-signature'];
  if (!keyId || !nonce || !signature || !Number.isFinite(timestamp)) {
    throw unauthorized('missing_signature', 'Headers di firma mancanti');
  }
  if (Math.abs(now() - timestamp) > config.signatureSkewMs) {
    throw unauthorized('stale_signature', 'Timestamp della firma fuori finestra');
  }

  const key = ctx.db.prepare('SELECT * FROM game_keys WHERE key_id = ?').get(keyId);
  if (!key || key.revoked_at) throw unauthorized('unknown_key', 'Chiave di gioco sconosciuta o revocata');

  const expected = sign({ secret: key.secret, timestamp, nonce, method, path, body: rawBody });
  if (expected.length !== String(signature).length || !timingSafeHex(expected, String(signature))) {
    throw unauthorized('bad_signature', 'Firma non valida');
  }

  // Anti-replay: il nonce può essere usato una sola volta.
  const seen = ctx.db.prepare('SELECT nonce FROM request_nonces WHERE key_id = ? AND nonce = ?').get(keyId, nonce);
  if (seen) throw forbidden('replayed_nonce', 'Nonce già utilizzato');
  ctx.db.prepare('INSERT INTO request_nonces (key_id, nonce, seen_at) VALUES (?, ?, ?)').run(keyId, nonce, now());
  ctx.db.prepare('DELETE FROM request_nonces WHERE seen_at < ?').run(now() - config.signatureSkewMs * 2);

  const game = ctx.db.prepare('SELECT * FROM games WHERE id = ?').get(key.game_id);
  if (!game) throw unauthorized('unknown_game', 'Gioco non registrato');
  return { game, keyId };
};

const timingSafeHex = (a, b) => {
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

/**
 * Autenticazione a token per i server di gioco Luau.
 * Roblox non espone primitive crittografiche, quindi firmare in HMAC dentro un
 * gioco significa spedire un'implementazione di SHA-256 in Luau. Il percorso
 * idiomatico è `HttpService:GetSecret()`: il segreto sta nello store dei Secrets
 * di Roblox, non è leggibile dal codice e non finisce nei log.
 * Header: `Authorization: Bearer <keyId>.<secret>`.
 */
export const verifyBearerKey = (ctx, headers) => {
  const raw = String(headers.authorization ?? '');
  if (!raw.startsWith('Bearer ')) return null;
  const credential = raw.slice(7);
  const separator = credential.indexOf('.');
  if (separator <= 0) return null;

  const keyId = credential.slice(0, separator);
  const secret = credential.slice(separator + 1);
  const key = ctx.db.prepare('SELECT * FROM game_keys WHERE key_id = ?').get(keyId);
  if (!key || key.revoked_at) throw unauthorized('unknown_key', 'Chiave di gioco sconosciuta o revocata');
  if (!safeEqual(secret, key.secret)) throw unauthorized('bad_credentials', 'Segreto di gioco non valido');

  const game = ctx.db.prepare('SELECT * FROM games WHERE id = ?').get(key.game_id);
  if (!game) throw unauthorized('unknown_game', 'Gioco non registrato');
  return { game, keyId };
};

/**
 * Accetta entrambi gli schemi: bearer (SDK Luau) e HMAC firmato
 * (integrazioni server-to-server, dove la firma protegge anche il corpo).
 */
export const verifyGameRequest = (ctx, request) => {
  const bearer = verifyBearerKey(ctx, request.headers);
  if (bearer) return bearer;
  return verifySignedRequest(ctx, request);
};
