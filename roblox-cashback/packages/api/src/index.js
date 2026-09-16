import { createServer } from 'node:http';
import { config } from './config.js';
import { createApp } from './app.js';
import { settleMaturedAwards } from './domain/purchases.js';

const app = createApp();
const server = createServer(app.handle);

// Il settlement gira in background: sblocca i cashback usciti dal periodo di hold.
const settleTimer = setInterval(() => {
  try {
    const result = settleMaturedAwards(app.ctx);
    if (result.settled > 0) console.log(`[settle] ${result.settled} cashback sbloccati`);
  } catch (error) {
    console.error('[settle] errore', error);
  }
}, 60_000);
settleTimer.unref();

server.listen(config.port, config.host, () => {
  console.log(`[api] in ascolto su http://${config.host}:${config.port} (roblox: ${config.robloxMode})`);
  if (!process.env.RBX_ADMIN_TOKEN) console.log(`[api] token admin di questa sessione: ${config.adminToken}`);
});

const shutdown = () => {
  server.close(() => {
    app.db.close();
    process.exit(0);
  });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
