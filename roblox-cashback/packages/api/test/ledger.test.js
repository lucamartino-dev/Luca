import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/db/index.js';
import * as ledger from '../src/domain/ledger.js';
import { resetClock } from '../src/util/clock.js';

test.afterEach(() => resetClock());

test('una transazione bilanciata aggiorna i saldi secondo la natura del conto', () => {
  const db = openDatabase(':memory:');
  ledger.post(db, {
    kind: 'cashback_accrual',
    entries: [
      { account: 'partner:prt_1:receivable', direction: 'debit', amount: 25_000 },
      { account: 'user:usr_1:pending', direction: 'credit', amount: 10_000 },
      { account: 'platform:revenue', direction: 'credit', amount: 15_000 }
    ]
  });
  assert.equal(ledger.balance(db, 'partner:prt_1:receivable'), 25_000);
  assert.equal(ledger.balance(db, 'user:usr_1:pending'), 10_000);
  assert.equal(ledger.balance(db, 'platform:revenue'), 15_000);
  assert.deepEqual(ledger.trialBalance(db), { debit: 25_000, credit: 25_000, balanced: true });
});

test('una transazione sbilanciata viene rifiutata e non lascia righe', () => {
  const db = openDatabase(':memory:');
  assert.throws(
    () =>
      ledger.post(db, {
        kind: 'broken',
        entries: [
          { account: 'partner:prt_1:receivable', direction: 'debit', amount: 100 },
          { account: 'user:usr_1:pending', direction: 'credit', amount: 90 }
        ]
      }),
    /sbilanciata/
  );
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM ledger_entries').get().n, 0);
});

test('i conti fuori dal piano dei conti non sono ammessi', () => {
  const db = openDatabase(':memory:');
  assert.throws(
    () =>
      ledger.post(db, {
        kind: 'broken',
        entries: [
          { account: 'user:usr_1:pending', direction: 'debit', amount: 10 },
          { account: 'cassa:nera', direction: 'credit', amount: 10 }
        ]
      }),
    /non riconosciuto/
  );
});

test('importi non interi o negativi sono rifiutati', () => {
  const db = openDatabase(':memory:');
  for (const amount of [0, -5, 1.5]) {
    assert.throws(
      () =>
        ledger.post(db, {
          kind: 'broken',
          entries: [
            { account: 'user:usr_1:pending', direction: 'debit', amount },
            { account: 'platform:revenue', direction: 'credit', amount }
          ]
        }),
      /Importo non valido/
    );
  }
});
