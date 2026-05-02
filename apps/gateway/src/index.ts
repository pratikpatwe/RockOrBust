import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import authRoutes from './routes/auth';
import cliRoutes from './routes/cli';
import statsRoutes from './routes/stats';
import { setupWebSocket } from './websocket';
import { setupProxy } from './proxy';
import { startUpdater } from './lib/updater';
import { rateLimit } from 'express-rate-limit';
import { supabase } from './lib/supabase';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// Standard limiter for public routes: 60 requests per minute
const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: { error: 'Too many requests. Please try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for stats: 10 requests per minute
const statsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Stats API rate limit exceeded. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors());
app.use(express.json());

// Landing Page (Cyber Aesthetic)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>RockOrBust Gateway</title>
      <style>
        body {
          margin: 0;
          background: #0a0a0a;
          color: #e0e0e0;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          overflow: hidden;
        }
        .container {
          text-align: center;
          border: 1px solid #333;
          padding: 3rem 4rem;
          background: rgba(20, 20, 20, 0.8);
          border-radius: 8px;
          box-shadow: 0 0 30px rgba(0,0,0,0.5);
          backdrop-filter: blur(10px);
        }
        .logo {
          font-size: 0.8rem;
          letter-spacing: 0.5rem;
          color: #666;
          margin-bottom: 2rem;
          text-transform: uppercase;
        }
        .status-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }
        .indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #00ff88;
          animation: pulse 2s infinite;
        }
        .label {
          font-size: 1.2rem;
          font-weight: 300;
        }
        .status-text {
          color: #00ff88;
          font-weight: bold;
        }
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
        .footer {
          margin-top: 2rem;
          font-size: 0.7rem;
          color: #444;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">RockOrBust Gateway</div>
        <div class="status-container">
          <div class="indicator"></div>
          <div class="label">STATUS: <span class="status-text">OPERATIONAL</span></div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Basic health check (JSON for monitoring tools)
app.get('/health', publicLimiter, (req, res) => {
  res.json({ status: 'ok', service: 'gateway' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/cli', publicLimiter, cliRoutes);
app.use('/api/stats', statsLimiter, statsRoutes);

/**
 * On every gateway boot, mark ALL previously-online nodes as offline.
 * This reconciles Supabase with the empty in-memory nodeRegistry so that
 * the stats API and routing are never in a split-brain state after a restart.
 * Nodes that are actually still running will reconnect within ~30 seconds
 * and register themselves again via the WebSocket handler.
 */
async function reconcileNodeState(): Promise<void> {
  console.log('[boot] Reconciling stale node state in Supabase...');
  const { error, count } = await supabase
    .from('rob_nodes')
    .update({ status: false })
    .eq('status', true);

  if (error) {
    // Non-fatal: log and continue. Stale rows will self-correct on next connect/disconnect.
    console.warn('[boot] Could not reconcile node state:', error.message);
  } else {
    console.log(`[boot] Marked ${count ?? 'unknown'} stale node(s) as offline.`);
  }
}

const server = http.createServer(app);
setupWebSocket(server);
setupProxy(server);

// Start background tasks
startUpdater();

// Reconcile stale DB state BEFORE accepting connections, then start listening.
reconcileNodeState().finally(() => {
  server.listen(port, () => {
    console.log(`Rock or Bust Gateway listening on port ${port}`);
  });
});
