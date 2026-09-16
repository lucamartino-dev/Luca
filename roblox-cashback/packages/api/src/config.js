import { randomBytes } from 'node:crypto';

const int = (name, fallback) => {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value)) throw new Error(`${name} non è un intero valido: ${raw}`);
  return value;
};

const bool = (name, fallback) => {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  return raw === '1' || raw.toLowerCase() === 'true';
};

/**
 * Tutti gli importi monetari interni sono in milli-Robux (mrbx): 1 Robux = 1000 mrbx.
 * Serve a non perdere frazioni sui cashback piccoli (10% di 5 Robux = 0,5 Robux).
 */
export const MRBX = 1000;

export const config = {
  port: int('PORT', 8787),
  host: process.env.HOST ?? '0.0.0.0',
  databaseFile: process.env.RBX_DB ?? 'data/robuxback.db',

  /** 'mock' non chiama roblox.com: serve per test e sviluppo offline. */
  robloxMode: process.env.RBX_MODE === 'mock' ? 'mock' : 'live',
  robloxOpenCloudKey: process.env.RBX_OPEN_CLOUD_KEY ?? null,

  /** Segreto per firmare i token di sessione dell'app. In produzione va da un secret manager. */
  appSecret: process.env.RBX_APP_SECRET ?? randomBytes(32).toString('hex'),
  /** Token del back office. Se non impostato ne viene generato uno a ogni avvio. */
  adminToken: process.env.RBX_ADMIN_TOKEN ?? randomBytes(24).toString('hex'),

  /** Cashback standard restituito al giocatore: 10%. */
  defaultCashbackBps: int('RBX_CASHBACK_BPS', 1000),
  /** Commissione standard pagata dal partner sul lordo attribuito: 25%. */
  defaultCommissionBps: int('RBX_COMMISSION_BPS', 2500),

  /** Finestra in cui un launch token può essere riscattato dal gioco. */
  launchTokenTtlMs: int('RBX_LAUNCH_TTL_MIN', 30) * 60_000,
  /** Durata di una sessione di gioco attribuita: gli acquisti oltre non maturano cashback. */
  sessionTtlMs: int('RBX_SESSION_TTL_MIN', 240) * 60_000,
  /** Periodo di sospensione prima che il cashback diventi riscattabile (finestra rimborsi). */
  holdMs: int('RBX_HOLD_DAYS', 7) * 86_400_000,
  /** Hold prolungato per account Roblox molto nuovi o utenti segnalati dal risk engine. */
  extendedHoldMs: int('RBX_EXTENDED_HOLD_DAYS', 21) * 86_400_000,

  /** Tolleranza di clock e TTL del nonce per le richieste firmate dai server di gioco. */
  signatureSkewMs: int('RBX_SIG_SKEW_SEC', 300) * 1000,

  /** Soglie del risk engine. */
  risk: {
    maxCashbackPerDayMrbx: int('RBX_MAX_DAILY_CASHBACK', 5000) * MRBX,
    manualReviewPurchaseMrbx: int('RBX_REVIEW_PURCHASE_ROBUX', 10_000) * MRBX,
    newAccountDays: int('RBX_NEW_ACCOUNT_DAYS', 30),
    maxPurchasesPerSession: int('RBX_MAX_PURCHASES_PER_SESSION', 200)
  },

  payout: {
    minRobux: int('RBX_PAYOUT_MIN', 100),
    maxPendingRequests: int('RBX_PAYOUT_MAX_PENDING', 3),
    /** I group payout richiedono 14 giorni di appartenenza al gruppo: regola di Roblox. */
    groupMembershipDays: 14
  },

  serveWeb: bool('RBX_SERVE_WEB', true)
};

export const bps = (amount, points) => Math.floor((amount * points) / 10_000);
