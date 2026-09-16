import { config } from '../config.js';
import { now } from '../util/clock.js';
import { randomId, randomToken, sha256, verificationCode } from '../util/crypto.js';
import { badRequest, conflict, forbidden, notFound, tooManyRequests, unauthorized } from '../util/errors.js';

const CHALLENGE_TTL_MS = 30 * 60_000;
const MAX_ATTEMPTS = 10;
const APP_SESSION_TTL_MS = 30 * 86_400_000;

/**
 * Collegamento dell'account Roblox senza password e senza OAuth:
 * l'utente incolla un codice nella propria bio pubblica, noi la rileggiamo.
 * È lo stesso schema usato dai bot di verifica dei server Discord.
 */
export const startVerification = async (ctx, username) => {
  const trimmed = String(username ?? '').trim();
  if (!/^[A-Za-z0-9_]{3,20}$/.test(trimmed)) {
    throw badRequest('invalid_username', 'Username Roblox non valido');
  }
  const found = await ctx.roblox.findUserByUsername(trimmed);
  if (!found) throw notFound('roblox_user_not_found', `Nessun utente Roblox chiamato ${trimmed}`);

  const code = verificationCode();
  const timestamp = now();
  const id = randomId('vc');
  ctx.db
    .prepare(
      `INSERT INTO verification_challenges (id, roblox_user_id, roblox_username, code, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(id, found.robloxUserId, found.username, code, timestamp, timestamp + CHALLENGE_TTL_MS);

  return {
    challengeId: id,
    code,
    robloxUserId: found.robloxUserId,
    username: found.username,
    expiresAt: timestamp + CHALLENGE_TTL_MS,
    instructions: `Incolla ${code} nella sezione "About" del tuo profilo Roblox, poi torna qui e conferma.`
  };
};

export const confirmVerification = async (ctx, challengeId) => {
  const challenge = ctx.db.prepare('SELECT * FROM verification_challenges WHERE id = ?').get(challengeId);
  if (!challenge) throw notFound('challenge_not_found', 'Richiesta di verifica inesistente');
  if (challenge.consumed_at) throw conflict('challenge_used', 'Codice già utilizzato');
  if (challenge.expires_at < now()) throw badRequest('challenge_expired', 'Codice scaduto, riprova');
  if (challenge.attempts >= MAX_ATTEMPTS) {
    throw tooManyRequests('too_many_attempts', 'Troppi tentativi su questo codice');
  }
  ctx.db.prepare('UPDATE verification_challenges SET attempts = attempts + 1 WHERE id = ?').run(challengeId);

  const profile = await ctx.roblox.getUser(challenge.roblox_user_id);
  if (!String(profile.description ?? '').includes(challenge.code)) {
    throw badRequest('code_not_found', 'Non trovo il codice nella bio del profilo. Salva le modifiche e riprova.');
  }

  const timestamp = now();
  ctx.db.prepare('UPDATE verification_challenges SET consumed_at = ? WHERE id = ?').run(timestamp, challengeId);

  let user = ctx.db.prepare('SELECT * FROM users WHERE roblox_user_id = ?').get(challenge.roblox_user_id);
  if (!user) {
    const id = randomId('usr');
    ctx.db
      .prepare(
        `INSERT INTO users (id, roblox_user_id, roblox_username, display_name, account_created_at, created_at, last_seen_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        challenge.roblox_user_id,
        profile.username,
        profile.displayName ?? profile.username,
        profile.createdAt ?? null,
        timestamp,
        timestamp
      );
    user = ctx.db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  } else {
    ctx.db
      .prepare('UPDATE users SET roblox_username = ?, display_name = ?, last_seen_at = ? WHERE id = ?')
      .run(profile.username, profile.displayName ?? profile.username, timestamp, user.id);
  }

  return { user, session: createAppSession(ctx, user.id) };
};

export const createAppSession = (ctx, userId) => {
  const token = randomToken(32);
  const timestamp = now();
  ctx.db
    .prepare('INSERT INTO app_sessions (id, user_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)')
    .run(randomId('as'), userId, sha256(token), timestamp, timestamp + APP_SESSION_TTL_MS);
  return { token, expiresAt: timestamp + APP_SESSION_TTL_MS };
};

export const authenticate = (ctx, authorizationHeader) => {
  const raw = String(authorizationHeader ?? '');
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : null;
  if (!token) throw unauthorized();
  const session = ctx.db.prepare('SELECT * FROM app_sessions WHERE token_hash = ?').get(sha256(token));
  if (!session || session.revoked_at || session.expires_at < now()) throw unauthorized('session_expired', 'Sessione scaduta');
  const user = ctx.db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id);
  if (!user) throw unauthorized();
  if (user.status === 'suspended') throw forbidden('account_suspended', 'Account sospeso');
  ctx.db.prepare('UPDATE users SET last_seen_at = ? WHERE id = ?').run(now(), user.id);
  return user;
};

export const revokeSession = (ctx, token) => {
  ctx.db.prepare('UPDATE app_sessions SET revoked_at = ? WHERE token_hash = ?').run(now(), sha256(token));
};

export const isNewRobloxAccount = (user) => {
  if (!user.account_created_at) return true;
  return now() - user.account_created_at < config.risk.newAccountDays * 86_400_000;
};

export const publicUser = (user) => ({
  id: user.id,
  robloxUserId: user.roblox_user_id,
  username: user.roblox_username,
  displayName: user.display_name,
  status: user.status,
  memberSince: user.created_at
});
