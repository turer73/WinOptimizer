import { Router } from 'express';
import { runScript, appendAudit } from '../psRunner.js';

const router = Router();

router.get('/', async (_req, res) => {
  const result = await runScript('services/Get-Services.ps1');
  res.json(result);
});

router.post('/disable', async (req, res) => {
  const { services, dryRun = true } = req.body || {};
  if (!Array.isArray(services) || services.length === 0) {
    return res.status(400).json({ error: 'services array required' });
  }
  const result = await runScript(
    'services/Disable-Services.ps1',
    { Services: services.join(',') },
    { dryRun },
  );
  await appendAudit({ module: 'services', action: 'disable', services, ...result });
  res.json(result);
});

export default router;
