#!/usr/bin/env node
/**
 * Popola un ambiente di sviluppo: un partner, due giochi e le relative chiavi.
 * Stampa le credenziali da mettere nel SDK Luau.
 */
import { createApp } from '../src/app.js';
import { createGame, createPartner, issueGameKey } from '../src/domain/catalog.js';
import { config } from '../src/config.js';

const app = createApp();

const existing = app.db.prepare('SELECT COUNT(*) AS n FROM partners').get().n;
if (existing > 0) {
  console.log('Il database contiene già dei partner: niente da fare.');
  process.exit(0);
}

const partner = createPartner(app.ctx, {
  name: 'Bloxy Studios',
  contactEmail: 'dev@bloxy.example',
  commissionBps: config.defaultCommissionBps
});

const games = [
  { placeId: 920_587_237, name: 'Tower Rush', description: 'Obby competitivo a tempo' },
  { placeId: 606_849_621, name: 'Neon Racers', description: 'Corse arcade con auto personalizzabili' }
];

for (const game of games) {
  const created = createGame(app.ctx, partner.id, { ...game, cashbackBps: config.defaultCashbackBps });
  const key = issueGameKey(app.ctx, created.id);
  console.log(`\n${created.name}  (placeId ${created.place_id})`);
  console.log(`  gameId : ${created.id}`);
  console.log(`  keyId  : ${key.keyId}`);
  console.log(`  secret : ${key.secret}`);
}

console.log(`\nToken admin: ${config.adminToken}`);
console.log('Avvia il server con: npm start');
app.db.close();
