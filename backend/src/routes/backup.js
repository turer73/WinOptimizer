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

export default router;
