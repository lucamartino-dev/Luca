import { createApp } from '../src/app.js';
import { openDatabase } from '../src/db/index.js';
import { createMockClient } from '../src/roblox/client.js';
import { config } from '../src/config.js';
import { createPartner, createGame, issueGameKey } from '../src/domain/catalog.js';
import { sign } from '../src/http/signature.js';
import { randomToken } from '../src/util/crypto.js';
import { now, setClock } from '../src/util/clock.js';

export const createTestApp = ({ robloxUsers = [] } = {}) => {
  setClock(Date.parse('2026-03-01T10:00:00Z'));
  const roblox = createMockClient([
    { robloxUserId: 4242, username: 'LucaPlays', displayName: 'Luca', createdAt: Date.parse('2019-05-04T00:00:00Z') },
    ...robloxUsers
  ]);
  const app = createApp({ db: openDatabase(':memory:'), roblox });

  const partner = createPartner(app.ctx, { name: 'Bloxy Studios', commissionBps: 2500 });
  const game = createGame(app.ctx, partner.id, {
    placeId: 9001,
    name: 'Tower Rush',
    description: 'Obby competitivo',
    cashbackBps: config.defaultCashbackBps
  });
  const key = issueGameKey(app.ctx, game.id);

  return { app, roblox, partner, game, key };
};

/** Richiesta firmata come la farebbe un server di gioco. */
export const gameRequest = async (app, key, { method = 'POST', path, body = null, overrides = {} }) => {
  const rawBody = body === null ? '' : JSON.stringify(body);
  const timestamp = overrides.timestamp ?? now();
  const nonce = overrides.nonce ?? randomToken(12);
  const signature =
    overrides.signature ??
    sign({ secret: overrides.secret ?? key.secret, timestamp, nonce, method, path, body: rawBody });
  return app.dispatch({
    method,
    url: path,
    rawBody,
    headers: {
      'x-cashback-key': overrides.keyId ?? key.keyId,
      'x-cashback-timestamp': String(timestamp),
      'x-cashback-nonce': nonce,
      'x-cashback-signature': signature,
      'content-type': 'application/json'
    }
  });
};

export const playerRequest = (app, { method = 'GET', path, body = null, token = null, headers = {} }) =>
  app.dispatch({
    method,
    url: path,
    rawBody: body === null ? '' : JSON.stringify(body),
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
      'content-type': 'application/json'
    }
  });

export const adminRequest = (app, { method = 'GET', path, body = null }) =>
  app.dispatch({
    method,
    url: path,
    rawBody: body === null ? '' : JSON.stringify(body),
    headers: { 'x-admin-token': config.adminToken, 'content-type': 'application/json' }
  });

/** Collega un account Roblox completando il giro di verifica via bio. */
export const linkAccount = async (app, roblox, username = 'LucaPlays') => {
  const start = await playerRequest(app, { method: 'POST', path: '/v1/auth/start', body: { username } });
  roblox.setDescription(start.body.robloxUserId, `Ciao! ${start.body.code} #roblox`);
  const confirm = await playerRequest(app, {
    method: 'POST',
    path: '/v1/auth/confirm',
    body: { challengeId: start.body.challengeId }
  });
  return { token: confirm.body.token, user: confirm.body.user };
};

/** Avvia il gioco dall'app e attribuisce la sessione lato server di gioco. */
export const startPlaySession = async ({ app, key, game, token, robloxUserId = 4242 }) => {
  const launch = await playerRequest(app, {
    method: 'POST',
    path: `/v1/games/${game.id}/launch`,
    token
  });
  const attribution = await gameRequest(app, key, {
    path: '/v1/game/session/attribute',
    body: { launchToken: launch.body.token, robloxUserId, jobId: 'job-test' }
  });
  return { launch: launch.body, attribution: attribution.body };
};
