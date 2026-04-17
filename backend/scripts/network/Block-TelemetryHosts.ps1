param([switch]$DryRun)
. "$PSScriptRoot\..\_Common.ps1"

$hosts = @(
    'vortex.data.microsoft.com',
    'vortex-win.data.microsoft.com',
    'telecommand.telemetry.microsoft.com',
    'watson.telemetry.microsoft.com',
    'watson.microsoft.com',
    'telemetry.microsoft.com',
    'oca.telemetry.microsoft.com',
    'sqm.telemetry.microsoft.com',
    'settings-sandbox.data.microsoft.com',
    'telemetry.appex.bing.net',
    'telemetry.urs.microsoft.com',
    'survey.watson.microsoft.com',
    'watson.ppe.telemetry.microsoft.com',
    'activity.windows.com'
)

$hostsFile = "$env:WINDIR\System32\drivers\etc\hosts"
$marker = '# WinOptimizer telemetry block'
$endMarker = '# /WinOptimizer telemetry block'

if (-not (Test-Path $hostsFile)) {
    Write-JsonResult @{ ok = $false; error = 'hosts file not found' }
    exit 1
}

$current = Get-Content -Path $hostsFile -ErrorAction SilentlyContinue
$alreadyBlocked = ($current | Where-Object { $_ -eq $marker }).Count -gt 0

$plan = $hosts | ForEach-Object { "0.0.0.0 $_" }

if ($DryRun) {
    Write-JsonResult @{
        dryRun = $true
        alreadyBlocked = $alreadyBlocked
        wouldAdd = $plan
        hostsFile = $hostsFile
    }
    return
}

if (-not (Test-IsAdmin)) {
    Write-JsonResult @{ ok = $false; error = 'Administrator required to edit hosts file' }
    exit 1
}

# Backup hosts file
$backupDir = Get-BackupDir
Copy-Item -Path $hostsFile -Destination (Join-Path $backupDir 'hosts.bak') -Force

if ($alreadyBlocked) {
    Write-JsonResult @{ ok = $true; alreadyBlocked = $true; added = 0 }
    return
}

$block = @($marker) + $plan + @($endMarker)
Add-Content -Path $hostsFile -Value $block -Encoding ASCII

Write-JsonResult @{ ok = $true; added = $plan.Count; backup = (Join-Path $backupDir 'hosts.bak') }
