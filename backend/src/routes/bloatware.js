import { Router } from 'express';
import { runScript, appendAudit } from '../psRunner.js';

const router = Router();

router.get('/installed', async (_req, res) => {
  const result = await runScript('bloatware/Get-InstalledApps.ps1');
  res.json(result);
});

router.post('/remove', async (req, res) => {
  const { apps, dryRun = true } = req.body || {};
  if (!Array.isArray(apps) || apps.length === 0) {
    return res.status(400).json({ error: 'apps array required' });
  }
  const result = await runScript(
    'bloatware/Remove-Apps.ps1',
    { Apps: apps.join(',') },
    { dryRun },
  );
  await appendAudit({ module: 'bloatware', action: 'remove', apps, ...result });
  res.json(result);
});

export default router;
