-- Tutti i timestamp sono epoch in millisecondi (INTEGER).
-- Tutti gli importi sono in milli-Robux (1 Robux = 1000 mrbx) e sono INTEGER.

CREATE TABLE IF NOT EXISTS users (
  id                TEXT PRIMARY KEY,
  roblox_user_id    INTEGER NOT NULL UNIQUE,
  roblox_username   TEXT NOT NULL,
  display_name      TEXT,
  account_created_at INTEGER,
  status            TEXT NOT NULL DEFAULT 'active', -- active | review | suspended
  created_at        INTEGER NOT NULL,
  last_seen_at      INTEGER
);

CREATE TABLE IF NOT EXISTS verification_challenges (
  id              TEXT PRIMARY KEY,
  roblox_user_id  INTEGER NOT NULL,
  roblox_username TEXT NOT NULL,
  code            TEXT NOT NULL,
  created_at      INTEGER NOT NULL,
  expires_at      INTEGER NOT NULL,
  consumed_at     INTEGER,
  attempts        INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_challenges_user ON verification_challenges(roblox_user_id);

CREATE TABLE IF NOT EXISTS app_sessions (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id),
  token_hash   TEXT NOT NULL UNIQUE,
  created_at   INTEGER NOT NULL,
  expires_at   INTEGER NOT NULL,
  revoked_at   INTEGER
);

CREATE TABLE IF NOT EXISTS partners (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  contact_email  TEXT,
  commission_bps INTEGER NOT NULL,
  status         TEXT NOT NULL DEFAULT 'active', -- active | paused
  created_at     INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS games (
  id            TEXT PRIMARY KEY,
  partner_id    TEXT NOT NULL REFERENCES partners(id),
  place_id      INTEGER NOT NULL UNIQUE,
  universe_id   INTEGER,
  name          TEXT NOT NULL,
  description   TEXT,
  icon_url      TEXT,
  cashback_bps  INTEGER NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active', -- active | paused
  created_at    INTEGER NOT NULL
);

-- Chiave HMAC per server di gioco. Il segreto qui è in chiaro solo perché il
-- riferimento gira su SQLite: in produzione va in un KMS (vedi docs/SECURITY.md).
CREATE TABLE IF NOT EXISTS game_keys (
  key_id     TEXT PRIMARY KEY,
  game_id    TEXT NOT NULL REFERENCES games(id),
  secret     TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  revoked_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_game_keys_game ON game_keys(game_id);

CREATE TABLE IF NOT EXISTS request_nonces (
  key_id  TEXT NOT NULL,
  nonce   TEXT NOT NULL,
  seen_at INTEGER NOT NULL,
  PRIMARY KEY (key_id, nonce)
);

CREATE TABLE IF NOT EXISTS launch_intents (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  game_id     TEXT NOT NULL REFERENCES games(id),
  token_hash  TEXT NOT NULL UNIQUE,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,
  consumed_at INTEGER,
  client_ip   TEXT,
  device_id   TEXT
);
CREATE INDEX IF NOT EXISTS idx_intents_user_game ON launch_intents(user_id, game_id, created_at);

CREATE TABLE IF NOT EXISTS play_sessions (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id),
  game_id      TEXT NOT NULL REFERENCES games(id),
  intent_id    TEXT REFERENCES launch_intents(id),
  job_id       TEXT,
  source       TEXT NOT NULL, -- launch_token | recent_intent
  started_at   INTEGER NOT NULL,
  expires_at   INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  ended_at     INTEGER
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON play_sessions(user_id, started_at);

CREATE TABLE IF NOT EXISTS purchases (
  id            TEXT PRIMARY KEY,
  receipt_id    TEXT NOT NULL,
  game_id       TEXT NOT NULL REFERENCES games(id),
  user_id       TEXT REFERENCES users(id),
  session_id    TEXT REFERENCES play_sessions(id),
  product_id    INTEGER NOT NULL,
  product_name  TEXT,
  gross_mrbx    INTEGER NOT NULL,
  purchased_at  INTEGER NOT NULL,
  received_at   INTEGER NOT NULL,
  status        TEXT NOT NULL, -- awarded | unattributed | review | reversed
  status_reason TEXT,
  UNIQUE (game_id, receipt_id)
);
CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id, purchased_at);

CREATE TABLE IF NOT EXISTS cashback_awards (
  id           TEXT PRIMARY KEY,
  purchase_id  TEXT NOT NULL UNIQUE REFERENCES purchases(id),
  user_id      TEXT NOT NULL REFERENCES users(id),
  game_id      TEXT NOT NULL REFERENCES games(id),
  amount_mrbx  INTEGER NOT NULL,
  state        TEXT NOT NULL, -- pending | available | reversed
  hold_until   INTEGER NOT NULL,
  created_at   INTEGER NOT NULL,
  settled_at   INTEGER
);
CREATE INDEX IF NOT EXISTS idx_awards_state ON cashback_awards(state, hold_until);
CREATE INDEX IF NOT EXISTS idx_awards_user ON cashback_awards(user_id, created_at);

CREATE TABLE IF NOT EXISTS ledger_accounts (
  name           TEXT PRIMARY KEY,
  type           TEXT NOT NULL, -- asset | liability | revenue | expense
  normal_balance TEXT NOT NULL, -- debit | credit
  created_at     INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ledger_transactions (
  id         TEXT PRIMARY KEY,
  kind       TEXT NOT NULL,
  ref_type   TEXT,
  ref_id     TEXT,
  memo       TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tx_ref ON ledger_transactions(ref_type, ref_id);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id          TEXT PRIMARY KEY,
  tx_id       TEXT NOT NULL REFERENCES ledger_transactions(id),
  account     TEXT NOT NULL REFERENCES ledger_accounts(name),
  direction   TEXT NOT NULL, -- debit | credit
  amount_mrbx INTEGER NOT NULL CHECK (amount_mrbx > 0),
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_entries_account ON ledger_entries(account);
CREATE INDEX IF NOT EXISTS idx_entries_tx ON ledger_entries(tx_id);

CREATE TABLE IF NOT EXISTS payout_requests (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id),
  amount_mrbx    INTEGER NOT NULL,
  method         TEXT NOT NULL, -- group_payout | gift_card
  destination    TEXT,
  state          TEXT NOT NULL, -- requested | approved | fulfilled | rejected | cancelled
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL,
  external_ref   TEXT,
  failure_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_payouts_user ON payout_requests(user_id, created_at);

CREATE TABLE IF NOT EXISTS risk_events (
  id         TEXT PRIMARY KEY,
  user_id    TEXT,
  game_id    TEXT,
  kind       TEXT NOT NULL,
  severity   TEXT NOT NULL, -- info | warn | block
  detail     TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_risk_user ON risk_events(user_id, created_at);

CREATE TABLE IF NOT EXISTS audit_log (
  id         TEXT PRIMARY KEY,
  actor      TEXT NOT NULL,
  action     TEXT NOT NULL,
  target     TEXT,
  detail     TEXT,
  created_at INTEGER NOT NULL
);
