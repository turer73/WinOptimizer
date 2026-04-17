import { Router } from 'express';
import { runScript, appendAudit } from '../psRunner.js';

const router = Router();

const actions = {
  'visual-effects':  'performance/Set-VisualEffectsPerformance.ps1',
  'disable-startup': 'performance/Disable-StartupApps.ps1',
  'power-high':      'performance/Set-PowerHighPerformance.ps1',
  'clear-temp':      'performance/Clear-TempFiles.ps1',
};

router.get('/', (_req, res) => {
  res.json({ actions: Object.keys(actions) });
});

router.post('/:action', async (req, res) => {
  const { action } = req.params;
  const script = actions[action];
  if (!script) return res.status(404).json({ error: `Unknown action: ${action}` });

  const dryRun = req.body?.dryRun !== false;
  const result = await runScript(script, {}, { dryRun });
  await appendAudit({ module: 'performance', action, ...result });
  res.json(result);
});

export default router;
