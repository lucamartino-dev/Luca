import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url');
export const randomId = (prefix) => `${prefix}_${randomBytes(12).toString('hex')}`;
export const sha256 = (value) => createHash('sha256').update(value).digest('hex');
export const hmac = (secret, payload) => createHmac('sha256', secret).update(payload).digest('hex');

/** Confronto a tempo costante che non rivela la lunghezza del segreto atteso. */
export const safeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(sha256(a), 'hex');
  const bufB = Buffer.from(sha256(b), 'hex');
  return timingSafeEqual(bufA, bufB);
};

/** Codice leggibile che l'utente incolla nella bio Roblox per provare di possedere l'account. */
export const verificationCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const raw = randomBytes(8);
  let out = '';
  for (const byte of raw) out += alphabet[byte % alphabet.length];
  return `RBXBACK-${out.slice(0, 4)}-${out.slice(4, 8)}`;
};
