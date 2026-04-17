import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { runScript, appendAudit, LOGS_ROOT } from './psRunner.js';
import privacyRouter from './routes/privacy.js';
import bloatwareRouter from './routes/bloatware.js';
import servicesRouter from './routes/services.js';
import networkRouter from './routes/network.js';
import performanceRouter from './routes/performance.js';
import backupRouter from './routes/backup.js';
import profilesRouter from './routes/profiles.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

// Request logger middleware
app.use((req, _res, next) => {
  if (req.path !== '/api/health') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

app.get('/api/health', async (_req, res) => {
  // Report whether we are elevated (needed for most changes)
  const probe = await runScript('backup/Test-Admin.ps1');
  res.json({
    ok: true,
    admin: probe.result?.admin === true,
    host: probe.result?.host ?? null,
    os: probe.result?.os ?? null,
    psVersion: probe.result?.psVersion ?? null,
  });
});

// Optional: serve the built frontend (frontend/dist) if it exists.
// This lets launch.ps1 -Build and Tauri run the whole thing from one port.
const distDir = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
try {
  const stat = await fs.stat(distDir);
  if (stat.isDirectory()) {
    app.use(express.static(distDir));
    console.log(`Serving built frontend from ${distDir}`);
  }
} catch {
  // No dist — running in dev mode with Vite proxy.
}

app.use('/api/privacy', privacyRouter);
app.use('/api/bloatware', bloatwareRouter);
app.use('/api/services', servicesRouter);
app.use('/api/network', networkRouter);
app.use('/api/performance', performanceRouter);
app.use('/api/backup', backupRouter);
app.use('/api/profiles', profilesRouter);

app.get('/api/logs', async (_req, res) => {
  const files = await fs.readdir(LOGS_ROOT).catch(() => []);
  const audits = files.filter((f) => f.startsWith('audit-')).sort().reverse();
  res.json({ files: audits });
});

app.get('/api/logs/:file', async (req, res) => {
  const safe = path.basename(req.params.file);
  if (!safe.startsWith('audit-') || !safe.endsWith('.log')) {
    return res.status(400).json({ error: 'Invalid log file name' });
  }
  try {
    const data = await fs.readFile(path.join(LOGS_ROOT, safe), 'utf8');
    const entries = data.trim().split('\n').filter(Boolean).map((l) => {
      try { return JSON.parse(l); } catch { return { raw: l }; }
    });
    res.json({ file: safe, entries });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Generic error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = Number(process.env.PORT) || 4545;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`WinOptimizer backend listening on http://127.0.0.1:${PORT}`);
  console.log(`Admin elevation is required for most apply actions.`);
});

export { runScript, appendAudit };
