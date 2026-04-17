# WinOptimizer

[![CI](https://github.com/turer73/WinOptimizer/actions/workflows/ci.yml/badge.svg)](https://github.com/turer73/WinOptimizer/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org)
[![PowerShell](https://img.shields.io/badge/powershell-5.1%20%7C%207-blue.svg)](https://docs.microsoft.com/powershell)

**Hybrid Windows privacy, debloat and performance toolkit** — PowerShell engine with an auditable web UI.

> Read the code before you run it. Every script is short, dot-sourced and dry-run capable.

---

## Why this exists

The usual tools are fine, but each has a trade-off:

| Tool | Problem |
|---|---|
| **ShutUp10++** | Closed-source — you're trusting a binary to touch your registry |
| **Win11Debloat** | Bundled as `irm \| iex` — one compromised endpoint and you run arbitrary code as admin |
| **O&O Shut-Up** | Not reversible per-setting — either restore-everything or nothing |

WinOptimizer solves all three:
- **You own the code.** Every `.ps1` is yours to read before running.
- **No remote execution.** Scripts live on disk, you see every line.
- **Every change is reversible.** Before any registry edit we serialize the old value to `backups/YYYYMMDD/reg-*.json`. A Restore button reads those and puts them back.

---

## Architecture

```
┌────────────────────────┐  HTTP   ┌──────────────────────┐  spawn  ┌───────────────────────┐
│  frontend (Vite+React) │ ──────► │  backend (Express)   │ ──────► │  PowerShell scripts   │
│  http://localhost:5173 │         │  http://127.0.0.1:   │         │  backend/scripts/*.ps1│
└────────────────────────┘         │  4545                │         └──────────┬────────────┘
                                   └──────────────────────┘                    │
                                             ▲                                 ▼
                                             │                        ┌────────────────┐
                                             │  audit log             │  Registry /    │
                                             └── logs/audit-*.log ◄───│  AppX /        │
                                                                      │  Services /    │
                                                                      │  Hosts / DNS   │
                                                                      └────────────────┘
```

Every HTTP call that mutates state:
1. PowerShell script reads the current value
2. Writes it to `backups/YYYYMMDD/reg-<hash>.json`
3. Applies the new value (or reports "would change" in dry-run)
4. Backend appends a JSON line to `logs/audit-<date>.log`

---

## Modules

| Module | What it does |
|---|---|
| `privacy` | Telemetry, advertising ID, Cortana, location, feedback, activity history |
| `bloatware` | Remove preinstalled UWP apps (Xbox, Teams consumer, Clipchamp, Solitaire, ...) |
| `services` | Disable `DiagTrack`, `dmwappushservice`, Xbox stack, `MapsBroker`, `Fax`, etc. |
| `network` | Append telemetry hosts to `hosts` file, set DNS to Cloudflare/Quad9, restore DNS |
| `performance` | Visual effects → performance, power plan → high perf, clear temp caches |
| `backup` | Export system state (registry + AppX + services + startup), create restore point, **restore previous state** |

---

## Profiles

| Profile | Risk | Steps | Description |
|---|---|---|---|
| **minimal**    | low    | 5  | Privacy essentials only. No app removal, no service changes. |
| **balanced**   | medium | 10 | Privacy hardening + common bloatware + Cortana off. Daily-driver preset. |
| **aggressive** | high   | 16 | Full lockdown: Xbox/maps services off, telemetry hosts blocked, DNS to Cloudflare. |

All profile steps are listed in `backend/profiles/*.json`. Copy one, edit it, save as your own.

---

## Quick start

Requirements:
- Windows 10/11
- Node.js 20+
- PowerShell 5.1 (built in) or PowerShell 7
- **Administrator privileges** (required for actual apply; dry-run works as normal user)

```powershell
# 1. Clone and install
git clone https://github.com/turer73/WinOptimizer.git
cd WinOptimizer
npm run install:all

# 2. Start dev servers (open a PowerShell "Run as Administrator" window)
npm run dev

# 3. Open http://localhost:5173
```

The UI warns you if it's running without admin — dry-run works, applying does not.

---

## Recommended workflow

1. **Start the app as a regular user first.** Everything still works in dry-run.
2. Click **Backup → Sistem Durumunu Dışa Aktar** to snapshot registry + AppX + services.
3. Click **Backup → System Restore Point** (requires admin).
4. Pick a profile, click **Dry-run** — review the JSON drawer carefully.
5. If the dry-run looks right, click **Uygula**.
6. Review `logs/audit-YYYYMMDD.log` — every step is recorded.
7. If something feels off, go back to **Backup → Geri Yükle** to undo.

---

## Restore

Two layers of rollback:

- **System Restore Point** — use Windows built-in "System Restore" if everything is broken.
- **Per-setting restore** — in the Backup tab, click **Dry-run Restore** on any backup folder to see what would change; then **Geri Yükle** to apply. This reads every `reg-*.json` entry and reverts it.

---

## Security model

- `irm | iex` is never used. All scripts are local files.
- HTTP server binds to `127.0.0.1` only — no LAN exposure.
- Restore-Registry refuses any `-Folder` path that escapes the `backups/` root.
- Scripts never auto-run on install. You start the UI, you click the button.
- CI runs PSScriptAnalyzer on every push to catch obvious mistakes.

**Caveats** (be honest about these):
- Windows Update can re-enable some settings — rerun the profile after major updates.
- Removing an AppX package is reversible only by reinstalling from the Store (the CSV only lists package names, not the underlying sources).
- `hosts` file edits are backed up once per day, not per-change — if you edit hosts yourself between runs, diff before restoring.
- This project touches system-wide settings. Read the code, take backups, own the outcome.

---

## Development

```powershell
# Run only the backend (for API debugging)
npm --workspace backend run dev   # listens on 4545

# Run only the frontend
npm --workspace frontend run dev  # listens on 5173, proxies /api to 4545

# Lint PowerShell locally (requires PSScriptAnalyzer)
Install-Module PSScriptAnalyzer -Scope CurrentUser
Invoke-ScriptAnalyzer -Path backend/scripts -Recurse
```

Project layout:

```
WinOptimizer/
├── backend/
│   ├── src/
│   │   ├── server.js          Express entry point
│   │   ├── psRunner.js        spawn + JSON parse helper
│   │   └── routes/            one file per module
│   ├── scripts/
│   │   ├── _Common.ps1        Set-RegistryValue, Save-RegistryValue, Test-IsAdmin
│   │   ├── privacy/*.ps1
│   │   ├── bloatware/*.ps1
│   │   ├── services/*.ps1
│   │   ├── network/*.ps1
│   │   ├── performance/*.ps1
│   │   └── backup/*.ps1       Export, checkpoint, restore
│   └── profiles/              minimal | balanced | aggressive .json
├── frontend/                  Vite + React + Tailwind
├── backups/                   git-ignored, per-date registry JSON backups
└── logs/                      git-ignored, audit-YYYYMMDD.log JSONL
```

---

## Status

Early development. Tested on Windows 11 Pro 23H2 / 24H2. Issues and PRs welcome.

## License

MIT — see [LICENSE](LICENSE).
