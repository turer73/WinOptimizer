import { Router } from 'express';
import { runScript, appendAudit } from '../psRunner.js';

const router = Router();

router.post('/export', async (_req, res) => {
  const result = await runScript('backup/Export-SystemState.ps1');
  await appendAudit({ module: 'backup', action: 'export', ...result });
  res.json(result);
});

router.post('/checkpoint', async (req, res) => {
  const description = (req.body?.description || `WinOptimizer-${Date.now()}`).replace(/[^\w\-]/g, '_');
  const result = await runScript('backup/New-Checkpoint.ps1', { Description: description });
  await appendAudit({ module: 'backup', action: 'checkpoint', description, ...result });
  res.json(result);
});

router.get('/list', async (_req, res) => {
  const result = await runScript('backup/List-Backups.ps1');
  res.json(result);
});

router.post('/restore', async (req, res) => {
  const { folder, dryRun = true } = req.body || {};
  if (!folder || typeof folder !== 'string') {
    return res.status(400).json({ error: 'folder required' });
  }
  // psRunner passes non-boolean args after the flag; plain string is fine
  const result = await runScript('backup/Restore-Registry.ps1', { Folder: folder }, { dryRun });
  await appendAudit({ module: 'backup', action: 'restore', folder, dryRun, ok: result.ok });
  res.json(result);
});

router.post('/import-reg', async (req, res) => {
  const { folder, file, dryRun = true } = req.body || {};
  if (!folder || !file) return res.status(400).json({ error: 'folder and file required' });
  const result = await runScript(
    'backup/Import-RegFile.ps1',
    { Folder: folder, File: file },
    { dryRun },
  );
  await appendAudit({ module: 'backup', action: 'import-reg', folder, file, dryRun, ok: result.ok });
  res.json(result);
});

export default router;
