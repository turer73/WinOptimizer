# Desktop packaging (Tauri)

This document explains how to build a standalone Windows installer for WinOptimizer.

> **Honest up-front:** Tauri produces a native Windows installer (~8–15 MB) that still requires `node.exe` on the target machine, because the backend runs in Node. A fully self-contained single-EXE build would require either rewriting the backend in Rust or bundling Node via `pkg`/`nexe`. Neither is done yet.

---

## What the Tauri shell does

- Opens a native Windows window sized 1200×800 with no Chrome tabs/bookmarks.
- On startup, spawns `node backend/src/server.js` as a child process.
- On close, kills the child so the port is freed.
- Bundles the entire `backend/` folder (including PowerShell scripts) as an application resource.
- Builds NSIS + MSI installers.

## Prerequisites

All on the machine that **builds** (not the one that runs):

1. **Rust** via [rustup](https://rustup.rs) — ~200 MB install, ~2 GB toolchain.
2. **Microsoft C++ Build Tools** (required by rustc on Windows): install "Desktop development with C++" workload from the [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/).
3. **WebView2 runtime** — already ships with Windows 11 and recent Windows 10 builds.
4. **Node 20+** and workspace deps (`npm run install:all`).

Target machines only need Node installed (or bundle it yourself — see below).

## Icons

Tauri expects `src-tauri/icons/icon.ico` plus scaled PNGs. Generate them from any source PNG:

```powershell
# Place your logo at src-tauri/icons/source.png (1024x1024 recommended)
npm run tauri -- icon src-tauri/icons/source.png
```

Without this step the build will fail.

## Dev run

```powershell
# Terminal as Administrator (optional — dry-run works as normal user)
npm run tauri:dev
```

This starts Vite (via `beforeDevCommand` in `tauri.conf.json`), builds the Rust shell in debug mode, opens the window, and spawns the Node backend.

## Release build

```powershell
npm run tauri:build
```

Output:

```
src-tauri/target/release/bundle/
├── nsis/WinOptimizer_0.1.0_x64-setup.exe
└── msi/WinOptimizer_0.1.0_x64_en-US.msi
```

Both installers bundle the same payload. Pick one to distribute.

## Known limitations

- **No code signing.** Without an EV cert, SmartScreen warns users on first launch. Acceptable for side-project / internal use.
- **Node.js is still required on target machines.** If you want truly self-contained, look into `pkg` or `nexe` to compile the backend to a single `.exe`, then adjust the `spawn_backend` call in `src-tauri/src/main.rs`.
- **PowerShell scripts live in `resources/backend/scripts`** after install. The Node backend resolves them via `path.resolve(__dirname, '..', 'scripts')` which keeps working because the directory layout is preserved.
- **Updates are not automatic.** Run the installer again to upgrade. If you want auto-update, Tauri has `tauri-plugin-updater` — not wired up yet.

## If you don't want to install Rust

Use `launch.ps1` instead — it gives you the same UX (auto-elevate + browser) without any compilation step. Tauri's only advantage is the native window feel and single-click MSI install.
