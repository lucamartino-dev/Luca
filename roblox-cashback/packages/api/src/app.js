import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { openDatabase } from './db/index.js';
import { createRobloxClient } from './roblox/client.js';
import { createRouter } from './http/router.js';
import { createRateLimiter } from './http/ratelimit.js';
import { registerPlayerRoutes } from './http/routes/player.js';
import { registerGameRoutes } from './http/routes/game.js';
import { registerAdminRoutes } from './http/routes/admin.js';
import { HttpError } from './util/errors.js';

const WEB_ROOT = resolve(fileURLToPath(new URL('../../web/public', import.meta.url)));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json'
};

export const createApp = ({ db = openDatabase(config.databaseFile), roblox = createRobloxClient() } = {}) => {
  const ctx = {
    db,
    roblox,
    config,
    /** Commissione applicata al partner proprietario del gioco. */
    partnerCommissionBps(game) {
      const partner = db.prepare('SELECT commission_bps FROM partners WHERE id = ?').get(game.partner_id);
      return partner?.commission_bps ?? config.defaultCommissionBps;
    }
  };

  const router = createRouter();
  registerPlayerRoutes(router, ctx);
  registerGameRoutes(router, ctx);
  registerAdminRoutes(router, ctx);

  router.get('/healthz', async () => ({ status: 200, body: { ok: true, mode: config.robloxMode } }));

  const authLimiter = createRateLimiter({ windowMs: 60_000, max: 20 });
  const generalLimiter = createRateLimiter({ windowMs: 60_000, max: 300 });

  /** Esegue una richiesta senza passare da un socket: usato dai test e dal server HTTP. */
  const dispatch = async ({ method = 'GET', url = '/', headers = {}, rawBody = '', ip = '127.0.0.1' }) => {
    const parsed = new URL(url, 'http://internal');
    const lowerHeaders = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
    try {
      generalLimiter(ip);
      if (parsed.pathname.startsWith('/v1/auth') || parsed.pathname.startsWith('/v1/payouts')) authLimiter(ip);

      const { handler, params } = router.match(method, parsed.pathname);
      let body = null;
      if (rawBody) {
        try {
          body = JSON.parse(rawBody);
        } catch {
          throw new HttpError(400, 'invalid_json', 'Corpo della richiesta non è JSON valido');
        }
      }
      const result = await handler({
        method,
        pathname: parsed.pathname,
        query: Object.fromEntries(parsed.searchParams),
        params,
        headers: lowerHeaders,
        rawBody,
        body,
        ip
      });
      return { status: result.status, body: result.body ?? null };
    } catch (error) {
      if (error instanceof HttpError) {
        return {
          status: error.status,
          body: { error: error.code, message: error.message, details: error.details ?? undefined }
        };
      }
      // Errori inattesi: logghiamo lo stack ma non lo esponiamo al client.
      console.error('[api] errore non gestito', error);
      return { status: 500, body: { error: 'internal_error', message: 'Errore interno' } };
    }
  };

  const serveStatic = async (pathname, res) => {
    const relative = pathname === '/' ? 'index.html' : normalize(pathname).replace(/^(\.\.[/\\])+/, '').slice(1);
    const filePath = join(WEB_ROOT, relative);
    if (!filePath.startsWith(WEB_ROOT)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    try {
      const file = await readFile(filePath);
      res.writeHead(200, { 'content-type': MIME[extname(filePath)] ?? 'application/octet-stream' }).end(file);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
    }
  };

  const handle = async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks).toString('utf8');
    const pathname = new URL(req.url, 'http://internal').pathname;

    if (config.serveWeb && !pathname.startsWith('/v1/') && pathname !== '/healthz') {
      await serveStatic(pathname, res);
      return;
    }

    const result = await dispatch({
      method: req.method,
      url: req.url,
      headers: req.headers,
      rawBody,
      ip: req.socket.remoteAddress ?? '0.0.0.0'
    });
    if (result.body === null) {
      res.writeHead(result.status).end();
      return;
    }
    const payload = JSON.stringify(result.body);
    res.writeHead(result.status, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }).end(payload);
  };

  return { ctx, db, router, dispatch, handle };
};
