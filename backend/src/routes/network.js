import { Router } from 'express';
import { runScript, appendAudit } from '../psRunner.js';

const router = Router();

const actions = {
  'telemetry-hosts': 'network/Block-TelemetryHosts.ps1',
  'dns-cloudflare':  'network/Set-DnsCloudflare.ps1',
  'dns-quad9':       'network/Set-DnsQuad9.ps1',
  'dns-restore':     'network/Restore-Dns.ps1',
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
  await appendAudit({ module: 'network', action, ...result });
  res.json(result);
});

export default router;
