#Requires -Version 5.1
<#
.SYNOPSIS
    Start WinOptimizer backend + frontend (built) and open the browser.
.DESCRIPTION
    - Auto-elevates to Administrator (the app warns if not elevated anyway).
    - Starts the Node backend on 127.0.0.1:4545.
    - If the frontend has been built (frontend/dist), serves it from the backend
      (see backend static route). Otherwise falls back to `npm run dev`.
    - Opens the default browser to the UI.
    - Waits for Ctrl+C or the backend window to close, then cleans up.
.EXAMPLE
    .\launch.ps1              # dev mode (auto-elevates)
    .\launch.ps1 -NoElevate   # stay as current user (dry-run only)
    .\launch.ps1 -Build       # build frontend first, then serve from backend
#>
[CmdletBinding()]
param(
    [switch]$NoElevate,
    [switch]$Build,
    [int]$Port = 4545
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

function Test-IsAdmin {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    (New-Object Security.Principal.WindowsPrincipal($id)).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not $NoElevate -and -not (Test-IsAdmin)) {
    Write-Host "Not elevated — relaunching as Administrator..." -ForegroundColor Yellow
    $argList = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSCommandPath`"")
    if ($Build) { $argList += '-Build' }
    Start-Process -FilePath 'powershell.exe' -ArgumentList $argList -Verb RunAs
    return
}

# Sanity check: Node present?
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Error "Node.js not found on PATH. Install Node 20+ from https://nodejs.org"
    return
}

# Install deps if missing
if (-not (Test-Path (Join-Path $root 'node_modules'))) {
    Write-Host "Installing dependencies (first run)..." -ForegroundColor Cyan
    Push-Location $root
    try { npm install } finally { Pop-Location }
}

# Optional: build frontend so backend can serve dist/
if ($Build) {
    Write-Host "Building frontend..." -ForegroundColor Cyan
    Push-Location $root
    try { npm --workspace frontend run build } finally { Pop-Location }
}

$hasDist = Test-Path (Join-Path $root 'frontend\dist\index.html')

# Start backend
Write-Host "Starting backend on http://127.0.0.1:$Port ..." -ForegroundColor Cyan
$env:PORT = "$Port"
$backend = Start-Process -FilePath 'node' `
    -ArgumentList @('backend/src/server.js') `
    -WorkingDirectory $root `
    -PassThru `
    -WindowStyle Minimized

Start-Sleep -Seconds 2

$url = if ($hasDist) { "http://127.0.0.1:$Port" } else { "http://localhost:5173" }

if (-not $hasDist) {
    # Dev mode — also start Vite
    Write-Host "Starting frontend dev server on http://localhost:5173 ..." -ForegroundColor Cyan
    $frontend = Start-Process -FilePath 'npm' `
        -ArgumentList @('--workspace', 'frontend', 'run', 'dev') `
        -WorkingDirectory $root `
        -PassThru `
        -WindowStyle Minimized
    Start-Sleep -Seconds 3
}

Write-Host "Opening $url" -ForegroundColor Green
Start-Process $url

Write-Host ""
Write-Host "WinOptimizer is running. Close this window or press Ctrl+C to stop." -ForegroundColor Green
Write-Host ""

try {
    # Wait for backend process to exit (user closes the minimized window or kills it)
    $backend | Wait-Process
} finally {
    Write-Host "Cleaning up..." -ForegroundColor Yellow
    if ($backend -and -not $backend.HasExited) {
        try { Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue } catch {}
    }
    if ($frontend -and -not $frontend.HasExited) {
        try { Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue } catch {}
    }
}
