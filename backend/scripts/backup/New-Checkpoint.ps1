param(
    [string]$Description = "WinOptimizer",
    [switch]$DryRun
)
. "$PSScriptRoot\..\_Common.ps1"

if ($DryRun) {
    Write-JsonResult @{ dryRun = $true; description = $Description }
    return
}

if (-not (Test-IsAdmin)) {
    Write-JsonResult @{ ok = $false; error = 'Administrator required for system restore point' }
    exit 1
}

try {
    # Ensure System Restore is enabled on the system drive
    Enable-ComputerRestore -Drive "$env:SystemDrive\" -ErrorAction SilentlyContinue
    Checkpoint-Computer -Description $Description -RestorePointType 'MODIFY_SETTINGS'
    Write-JsonResult @{ ok = $true; description = $Description; timestamp = (Get-Date).ToString('o') }
} catch {
    Write-JsonResult @{ ok = $false; error = $_.Exception.Message }
    exit 1
}
