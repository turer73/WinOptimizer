import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const SCRIPTS_ROOT = path.resolve(__dirname, '..', 'scripts');
export const LOGS_ROOT = path.resolve(__dirname, '..', '..', 'logs');
export const BACKUPS_ROOT = path.resolve(__dirname, '..', '..', 'backups');

await fs.mkdir(LOGS_ROOT, { recursive: true });
await fs.mkdir(BACKUPS_ROOT, { recursive: true });

/**
 * Execute a PowerShell script and capture JSON stdout.
 * Scripts MUST emit JSON on their last line (or ConvertTo-Json piped).
 *
 * @param {string} relativeScript   e.g. "privacy/Disable-Telemetry.ps1"
 * @param {object} args             Parameters passed as -Key Value
 * @param {object} options          { dryRun: bool, admin: bool }
 */
export function runScript(relativeScript, args = {}, options = {}) {
  const scriptPath = path.join(SCRIPTS_ROOT, relativeScript);
  const psArgs = [
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy', 'Bypass',
    '-File', scriptPath,
  ];

  if (options.dryRun) psArgs.push('-DryRun');

  for (const [key, value] of Object.entries(args)) {
    psArgs.push(`-${key}`);
    if (value !== true && value !== undefined) {
      psArgs.push(String(value));
    }
  }

  return new Promise((resolve) => {
    const proc = spawn('powershell.exe', psArgs, { windowsHide: true });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d.toString('utf8'); });
    proc.stderr.on('data', (d) => { stderr += d.toString('utf8'); });

    proc.on('close', (code) => {
      let parsed = null;
      const trimmed = stdout.trim();
      if (trimmed) {
        // PowerShell may output warnings before JSON — find JSON object/array start.
        const jsonStart = trimmed.search(/[{[]/);
        if (jsonStart >= 0) {
          try {
            parsed = JSON.parse(trimmed.slice(jsonStart));
          } catch {
            parsed = null;
          }
        }
      }

      resolve({
        ok: code === 0,
        exitCode: code,
        stdout,
        stderr,
        result: parsed,
        script: relativeScript,
        args,
        dryRun: !!options.dryRun,
        timestamp: new Date().toISOString(),
      });
    });

    proc.on('error', (err) => {
      resolve({
        ok: false,
        exitCode: -1,
        stdout,
        stderr: stderr + '\n' + err.message,
        result: null,
        script: relativeScript,
        args,
        dryRun: !!options.dryRun,
        timestamp: new Date().toISOString(),
      });
    });
  });
}

export async function appendAudit(entry) {
  const date = new Date().toISOString().slice(0, 10);
  const file = path.join(LOGS_ROOT, `audit-${date}.log`);
  await fs.appendFile(file, JSON.stringify(entry) + '\n', 'utf8');
}
