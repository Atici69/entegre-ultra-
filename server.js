import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marketplaceStatus } from './marketplaces/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT) || 10000;

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(express.json({ limit: '1mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false
});
app.use('/api/', apiLimiter);

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, service: 'trend-entegre-api' });
});

app.get('/api/v1/marketplaces', (_req, res) => {
  res.status(200).json({ success: true, data: marketplaceStatus() });
});

app.post('/api/v1/marketplaces/:marketplace/test', (req, res) => {
  const supported = ['trendyol', 'hepsiburada', 'n11', 'amazon'];
  const marketplace = String(req.params.marketplace || '').toLowerCase();

  if (!supported.includes(marketplace)) {
    return res.status(404).json({ success: false, error: 'Desteklenmeyen pazaryeri.' });
  }

  return res.status(501).json({
    success: false,
    error: 'Bu pazaryeri için API kimlik bilgileri ve bağlantı testi henüz yapılandırılmadı.',
    marketplace
  });
});

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: 'API endpoint bulunamadı.' });
  }
  return res.sendFile(path.join(distPath, 'index.html'), (error) => {
    if (error) next(error);
  });
});

app.use((error, _req, res, _next) => {
  console.error('Sunucu hatası:', error);
  res.status(500).json({ success: false, error: 'Sunucu tarafında beklenmeyen bir hata oluştu.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Trend Entegre API listening on port ${PORT}`);
});
