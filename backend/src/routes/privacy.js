import { Router } from 'express';
import { runScript, appendAudit } from '../psRunner.js';

const router = Router();

const actions = {
  'telemetry':     'privacy/Disable-Telemetry.ps1',
  'advertising':   'privacy/Disable-AdvertisingId.ps1',
  'cortana':       'privacy/Disable-Cortana.ps1',
  'location':      'privacy/Disable-LocationTracking.ps1',
  'feedback':      'privacy/Disable-Feedback.ps1',
  'activity':      'privacy/Disable-ActivityHistory.ps1',
};

router.get('/', (_req, res) => {
  res.json({ actions: Object.keys(actions) });
});

router.post('/:action', async (req, res) => {
  const { action } = req.params;
  const script = actions[action];
  if (!script) return res.status(404).json({ error: `Unknown action: ${action}` });

  const dryRun = req.body?.dryRun !== false; // default to dry-run
  const result = await runScript(script, {}, { dryRun });
  await appendAudit({ module: 'privacy', action, ...result });
  res.json(result);
});

export default router;
