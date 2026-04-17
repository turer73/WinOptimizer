# WinOptimizer

Hybrid Windows privacy, debloat and performance toolkit.

- **Engine:** PowerShell scripts (transparent, auditable, revertible)
- **API:** Node.js + Express localhost server
- **UI:** Vite + React + Tailwind web interface

## Why

Existing tools (ShutUp10, Win11Debloat) are great but either closed-source, `irm | iex` patterns, or hard to audit. This project:

- Every change is logged with the original value (full undo)
- Runs a System Restore point + state export before any apply
- Dry-run mode shows exactly what would change before you commit
- Modular JSON profiles (minimal / balanced / aggressive) — or build your own
- No third-party scripts, no remote execution, you read every line

## Modules

| Module | Purpose |
|---|---|
| `privacy` | Telemetry, advertising ID, Cortana, location tracking, diagnostic data |
| `bloatware` | Remove pre-installed UWP apps (Xbox, Teams consumer, Clipchamp, etc.) |
| `services` | Disable unnecessary Windows services (DiagTrack, Xbox, Fax, etc.) |
| `network` | DNS hardening, telemetry hosts, firewall tightening |
| `performance` | Visual effects, startup apps, search indexing tuning |
| `backup` | Full system state export + restore points |

## Quick start

```powershell
# 1. Install dependencies
npm run install:all

# 2. Start dev servers (run PowerShell as Administrator for real changes)
npm run dev

# 3. Open http://localhost:5173
```

## Safety

- **Always** takes a System Restore point before applying changes
- Registry keys exported to `backups/` before modification
- AppX package list saved before removal
- Every action written to `logs/audit-YYYYMMDD.log` with before/after state
- `restore` command rolls back any applied profile

## Architecture

```
frontend (Vite + React) ──HTTP──► backend (Express)
                                     │
                                     └──spawn──► PowerShell scripts
                                                     │
                                                     └──> Registry / AppX / Services
```

## Status

🚧 Early development. Use at your own risk. Read the code before running.

## License

MIT
