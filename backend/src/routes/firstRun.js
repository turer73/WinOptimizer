import { Router } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { runScript, appendAudit, BACKUPS_ROOT } from '../psRunner.js';

const router = Router();
const MARKER_FILE = path.join(BACKUPS_ROOT, '.first-run.json');

async function readMarker() {
  try {
    const data = await fs.readFile(MARKER_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function writeMarker(payload) {
  await fs.writeFile(MARKER_FILE, JSON.stringify(payload, null, 2), 'utf8');
}

router.get('/status', async (_req, res) => {
  const marker = await readMarker();
  res.json({
    completed: !!marker?.completed,
    completedAt: marker?.completedAt ?? null,
    lastResult: marker?.summary ?? null,
  });
});

router.post('/ensure', async (req, res) => {
  const dryRun = req.body?.dryRun === true; // default is REAL run — first-run is mandatory
  const result = await runScript('backup/Ensure-FirstRunSafety.ps1', {}, { dryRun });
  await appendAudit({ module: 'first-run', action: 'ensure', dryRun, ok: result.ok });

  // Only mark completed on a successful real run.
  if (!dryRun && result.ok && result.result?.ok) {
    await writeMarker({
      completed: true,
      completedAt: new Date().toISOString(),
      summary: {
        admin: result.result.admin,
        systemDrive: result.result.systemDrive,
        latestRestorePoint: result.result.latestRestorePoint ?? null,
      },
    });
  }

  res.json(result);
});

router.post('/reset', async (_req, res) => {
  // Allow the user to force the first-run flow again (e.g. after a Windows reinstall)
  try {
    await fs.unlink(MARKER_FILE);
  } catch {}
  res.json({ ok: true });
});

export default router;
