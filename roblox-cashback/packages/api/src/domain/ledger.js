import { randomId } from '../util/crypto.js';
import { now } from '../util/clock.js';

/**
 * Partita doppia in milli-Robux. Ogni transazione deve avere
 * somma(dare) === somma(avere), altrimenti viene rifiutata.
 *
 * Piano dei conti:
 *   user:<id>:pending        passività  il cashback maturato ma ancora in hold
 *   user:<id>:available      passività  il cashback riscattabile
 *   user:<id>:reserved       passività  il cashback bloccato da una richiesta di payout
 *   partner:<id>:receivable  attività   la commissione che il partner ci deve
 *   platform:revenue         ricavo     il margine (commissione - cashback)
 *   platform:payout_float    attività   i Robux/gift card usciti per pagare gli utenti
 */

const ACCOUNT_TYPES = [
  [/^user:[^:]+:(pending|available|reserved)$/, { type: 'liability', normal: 'credit' }],
  [/^partner:[^:]+:receivable$/, { type: 'asset', normal: 'debit' }],
  [/^platform:revenue$/, { type: 'revenue', normal: 'credit' }],
  [/^platform:payout_float$/, { type: 'asset', normal: 'debit' }],
  [/^platform:reversals$/, { type: 'expense', normal: 'debit' }]
];

const classify = (account) => {
  for (const [pattern, meta] of ACCOUNT_TYPES) if (pattern.test(account)) return meta;
  throw new Error(`Conto contabile non riconosciuto: ${account}`);
};

export const userAccount = (userId, bucket) => `user:${userId}:${bucket}`;
export const partnerAccount = (partnerId) => `partner:${partnerId}:receivable`;

const ensureAccount = (db, account) => {
  const existing = db.prepare('SELECT name FROM ledger_accounts WHERE name = ?').get(account);
  if (existing) return;
  const meta = classify(account);
  db.prepare('INSERT INTO ledger_accounts (name, type, normal_balance, created_at) VALUES (?, ?, ?, ?)')
    .run(account, meta.type, meta.normal, now());
};

/** Registra una transazione bilanciata. Va chiamata dentro una transazione SQLite. */
export const post = (db, { kind, refType = null, refId = null, memo = null, entries }) => {
  if (!Array.isArray(entries) || entries.length < 2) {
    throw new Error('Una scrittura contabile richiede almeno due righe');
  }
  let debit = 0;
  let credit = 0;
  for (const entry of entries) {
    if (!Number.isInteger(entry.amount) || entry.amount <= 0) {
      throw new Error(`Importo non valido su ${entry.account}: ${entry.amount}`);
    }
    if (entry.direction === 'debit') debit += entry.amount;
    else if (entry.direction === 'credit') credit += entry.amount;
    else throw new Error(`Direzione non valida: ${entry.direction}`);
  }
  if (debit !== credit) {
    throw new Error(`Transazione sbilanciata: dare ${debit} mrbx, avere ${credit} mrbx`);
  }

  const timestamp = now();
  const txId = randomId('tx');
  db.prepare(
    'INSERT INTO ledger_transactions (id, kind, ref_type, ref_id, memo, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(txId, kind, refType, refId, memo, timestamp);

  const insertEntry = db.prepare(
    'INSERT INTO ledger_entries (id, tx_id, account, direction, amount_mrbx, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  for (const entry of entries) {
    ensureAccount(db, entry.account);
    insertEntry.run(randomId('le'), txId, entry.account, entry.direction, entry.amount, timestamp);
  }
  return txId;
};

/** Saldo di un conto, con segno rispetto alla sua natura (dare o avere). */
export const balance = (db, account) => {
  const row = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN direction = 'debit' THEN amount_mrbx ELSE 0 END), 0) AS debit,
         COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount_mrbx ELSE 0 END), 0) AS credit
       FROM ledger_entries WHERE account = ?`
    )
    .get(account);
  const meta = classify(account);
  return meta.normal === 'debit' ? row.debit - row.credit : row.credit - row.debit;
};

export const userBalances = (db, userId) => {
  const pending = balance(db, userAccount(userId, 'pending'));
  const available = balance(db, userAccount(userId, 'available'));
  const reserved = balance(db, userAccount(userId, 'reserved'));
  return { pending, available, reserved, total: pending + available + reserved };
};

/** Controllo di integrità globale: la somma di tutte le righe deve fare zero. */
export const trialBalance = (db) => {
  const row = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN direction = 'debit' THEN amount_mrbx ELSE 0 END), 0) AS debit,
         COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount_mrbx ELSE 0 END), 0) AS credit
       FROM ledger_entries`
    )
    .get();
  return { debit: row.debit, credit: row.credit, balanced: row.debit === row.credit };
};

export const accountStatement = (db, account, limit = 50) =>
  db
    .prepare(
      `SELECT e.id, e.direction, e.amount_mrbx, e.created_at, t.kind, t.memo, t.ref_type, t.ref_id
       FROM ledger_entries e JOIN ledger_transactions t ON t.id = e.tx_id
       WHERE e.account = ? ORDER BY e.created_at DESC, e.id DESC LIMIT ?`
    )
    .all(account, limit);
