import { config } from '../config.js';
import { HttpError } from '../util/errors.js';

const USERS_API = 'https://users.roblox.com';
const THUMBS_API = 'https://thumbnails.roblox.com';

const json = async (url, init = {}) => {
  const response = await fetch(url, {
    ...init,
    headers: { 'content-type': 'application/json', accept: 'application/json', ...(init.headers ?? {}) }
  });
  if (!response.ok) {
    throw new HttpError(502, 'roblox_upstream', `Roblox ha risposto ${response.status} su ${url}`);
  }
  return response.json();
};

/** Client reale verso le API pubbliche di Roblox. */
export const liveClient = {
  async findUserByUsername(username) {
    const body = JSON.stringify({ usernames: [username], excludeBannedUsers: false });
    const data = await json(`${USERS_API}/v1/usernames/users`, { method: 'POST', body });
    const hit = data.data?.[0];
    if (!hit) return null;
    return { robloxUserId: hit.id, username: hit.name, displayName: hit.displayName };
  },

  async getUser(robloxUserId) {
    const data = await json(`${USERS_API}/v1/users/${robloxUserId}`);
    return {
      robloxUserId: data.id,
      username: data.name,
      displayName: data.displayName,
      description: data.description ?? '',
      createdAt: Date.parse(data.created)
    };
  },

  async getAvatarUrl(robloxUserId) {
    const url = `${THUMBS_API}/v1/users/avatar-headshot?userIds=${robloxUserId}&size=150x150&format=Png`;
    const data = await json(url);
    return data.data?.[0]?.imageUrl ?? null;
  }
};

/**
 * Client finto per test e sviluppo offline: nessuna chiamata di rete.
 * `seed()` popola profili verosimili, `setDescription()` simula l'utente che
 * incolla il codice di verifica nella bio.
 */
export const createMockClient = (initial = [], { autoCreate = false } = {}) => {
  const users = new Map();
  const add = (user) => users.set(user.robloxUserId, { description: '', createdAt: Date.now() - 400 * 86_400_000, ...user });
  initial.forEach(add);

  /** In modalità sviluppo inventiamo l'utente invece di rispondere 404. */
  const invent = (username) => {
    let hash = 0;
    for (const char of username) hash = (hash * 31 + char.charCodeAt(0)) % 90_000_000;
    const user = { robloxUserId: 1_000_000 + hash, username, displayName: username };
    add(user);
    return users.get(user.robloxUserId);
  };

  return {
    _mock: true,
    seed: add,
    setDescription(robloxUserId, description) {
      const user = users.get(robloxUserId);
      if (!user) throw new Error(`Utente mock inesistente: ${robloxUserId}`);
      user.description = description;
    },
    async findUserByUsername(username) {
      for (const user of users.values()) {
        if (user.username.toLowerCase() === username.toLowerCase()) {
          return { robloxUserId: user.robloxUserId, username: user.username, displayName: user.displayName };
        }
      }
      if (!autoCreate) return null;
      const created = invent(username);
      return { robloxUserId: created.robloxUserId, username: created.username, displayName: created.displayName };
    },
    async getUser(robloxUserId) {
      const user = users.get(robloxUserId);
      if (!user) throw new HttpError(404, 'roblox_user_not_found', 'Utente Roblox inesistente');
      return { ...user };
    },
    async getAvatarUrl(robloxUserId) {
      return `https://example.invalid/avatar/${robloxUserId}.png`;
    }
  };
};

export const createRobloxClient = () =>
  config.robloxMode === 'mock' ? createMockClient([], { autoCreate: true }) : liveClient;
