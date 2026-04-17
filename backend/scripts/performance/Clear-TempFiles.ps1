param([switch]$DryRun)
. "$PSScriptRoot\..\_Common.ps1"

$targets = @(
    "$env:TEMP",
    "$env:WINDIR\Temp",
    "$env:LOCALAPPDATA\Microsoft\Windows\INetCache",
    "$env:LOCALAPPDATA\Microsoft\Windows\WER"
)

$summary = @()
foreach ($t in $targets) {
    if (-not (Test-Path $t)) {
        $summary += @{ path = $t; present = $false }
        continue
    }
    $files = Get-ChildItem -Path $t -Recurse -File -Force -ErrorAction SilentlyContinue
    $bytes = ($files | Measure-Object -Property Length -Sum).Sum
    $count = $files.Count

    if (-not $DryRun) {
        # Delete files only, leave directory structure intact
        $files | ForEach-Object {
            try { Remove-Item -Path $_.FullName -Force -ErrorAction SilentlyContinue } catch {}
        }
    }

    $summary += @{
        path = $t
        present = $true
        fileCount = $count
        bytes = $bytes
        dryRun = [bool]$DryRun
    }
}

Write-JsonResult @{
    module = 'performance'
    action = 'clear-temp'
    dryRun = [bool]$DryRun
    targets = $summary
}
