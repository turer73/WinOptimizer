import { Router } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runScript, appendAudit } from '../psRunner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROFILES_DIR = path.resolve(__dirname, '..', '..', 'profiles');

const router = Router();

router.get('/', async (_req, res) => {
  const files = await fs.readdir(PROFILES_DIR);
  const profiles = [];
  for (const file of files.filter((f) => f.endsWith('.json'))) {
    const content = JSON.parse(await fs.readFile(path.join(PROFILES_DIR, file), 'utf8'));
    profiles.push({ id: file.replace(/\.json$/, ''), ...content });
  }
  res.json({ profiles });
});

router.get('/:id', async (req, res) => {
  const safe = path.basename(req.params.id).replace(/\.json$/, '');
  try {
    const content = JSON.parse(await fs.readFile(path.join(PROFILES_DIR, `${safe}.json`), 'utf8'));
    res.json({ id: safe, ...content });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

router.post('/:id/apply', async (req, res) => {
  const safe = path.basename(req.params.id).replace(/\.json$/, '');
  const dryRun = req.body?.dryRun !== false;

  let profile;
  try {
    profile = JSON.parse(await fs.readFile(path.join(PROFILES_DIR, `${safe}.json`), 'utf8'));
  } catch (err) {
    return res.status(404).json({ error: err.message });
  }

  const results = [];
  for (const step of profile.steps || []) {
    const r = await runScript(step.script, step.args || {}, { dryRun });
    results.push({ step: step.name, script: step.script, ...r });
    await appendAudit({ module: 'profile', profile: safe, step: step.name, dryRun, ok: r.ok });
    if (!r.ok && step.stopOnError) break;
  }

  res.json({ profile: safe, dryRun, steps: results });
});

export default router;
