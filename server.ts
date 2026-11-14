import express, { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '.data');
const STATE_FILE = path.join(DATA_DIR, 'site_state.json');

interface StoredServerPayload {
  version: number;
  updatedAt: string;
  actorEmail?: string;
  state: Record<string, unknown>;
}

let cachedPayload: StoredServerPayload | null = null;

function loadStoredState(): StoredServerPayload | null {
  if (cachedPayload) return cachedPayload;
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf8');
      const parsed = JSON.parse(raw) as StoredServerPayload;
      if (parsed && typeof parsed === 'object' && parsed.state) {
        cachedPayload = parsed;
        return cachedPayload;
      }
    }
  } catch {
    // ignore read errors
  }
  return null;
}

function saveStoredState(state: Record<string, unknown>, actorEmail?: string): StoredServerPayload {
  const prev = loadStoredState();
  const nextVersion = (prev?.version || 0) + 1;
  const payload: StoredServerPayload = {
    version: nextVersion,
    updatedAt: new Date().toISOString(),
    actorEmail: actorEmail || 'admin',
    state,
  };
  cachedPayload = payload;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(payload), 'utf8');
  } catch {
    // ignore disk write errors if read-only container
  }
  return payload;
}

const sseClients = new Set<Response>();

function broadcastStateUpdate(payload: StoredServerPayload, senderClientId?: string) {
  const msg = JSON.stringify({
    version: payload.version,
    updatedAt: payload.updatedAt,
    actorEmail: payload.actorEmail,
    senderClientId: senderClientId || '',
    state: payload.state,
  });
  for (const client of sseClients) {
    try {
      client.write(`data: ${msg}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '35mb' }));

  // 1. GET /api/site-state — Fetch latest authoritative state for visitors, employees & admins
  app.get('/api/site-state', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const stored = loadStoredState();
    if (!stored) {
      res.json({ exists: false, version: 0, state: null });
      return;
    }
    res.json({
      exists: true,
      version: stored.version,
      updatedAt: stored.updatedAt,
      actorEmail: stored.actorEmail,
      state: stored.state,
    });
  });

  // 2. POST /api/site-state — Save updated state from any authorized Admin or Employee and broadcast live
  app.post('/api/site-state', (req: Request, res: Response) => {
    try {
      const body = req.body as {
        state?: Record<string, unknown>;
        actorEmail?: string;
        clientId?: string;
      };
      if (!body || !body.state || typeof body.state !== 'object') {
        res.status(400).json({ ok: false, error: 'Invalid state payload' });
        return;
      }

      const saved = saveStoredState(body.state, body.actorEmail);
      broadcastStateUpdate(saved, body.clientId);

      res.json({
        ok: true,
        version: saved.version,
        updatedAt: saved.updatedAt,
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // 3. GET /api/site-stream — Real-time SSE stream for instant sync across all devices & browsers
  app.get('/api/site-stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send initial heartbeat
    res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);

    sseClients.add(res);

    const keepAlive = setInterval(() => {
      try {
        res.write(': keep-alive\n\n');
      } catch {
        clearInterval(keepAlive);
        sseClients.delete(res);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(res);
    });
  });

  const distPath = path.join(__dirname, 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distPath);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
