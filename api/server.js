import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { getPool, closePool } from './db.js';

const app = express();
const port = Number(process.env.PORT || 3000);
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  }
}));
app.use(express.json({ limit: '256kb' }));
app.use('/api', rateLimit({
  windowMs: 60_000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false
}));

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'entegre-ultra-api',
    timestamp: new Date().toISOString()
  });
});

app.get('/health/database', async (_req, res) => {
  try {
    const [rows] = await getPool().query('SELECT 1 AS connection_ok');
    const ok = Number(rows?.[0]?.connection_ok) === 1;
    res.status(ok ? 200 : 503).json({ ok, database: 'mysql' });
  } catch (error) {
    console.error('Database health check failed:', error?.message || 'Unknown error');
    res.status(503).json({
      ok: false,
      database: 'mysql',
      error: 'Database connection is unavailable'
    });
  }
});

app.use((error, _req, res, _next) => {
  if (error?.message === 'Origin is not allowed by CORS') {
    return res.status(403).json({ error: 'Origin is not allowed' });
  }
  console.error('Unhandled API error:', error?.message || 'Unknown error');
  return res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Entegre Ultra API listening on port ${port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received; shutting down`);
  server.close(async () => {
    try {
      await closePool();
      process.exit(0);
    } catch (error) {
      console.error('Shutdown failed:', error?.message || 'Unknown error');
      process.exit(1);
    }
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
