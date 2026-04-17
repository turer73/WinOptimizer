param([switch]$DryRun)
. "$PSScriptRoot\..\_Common.ps1"

$highPerfGuid = '8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c'

if ($DryRun) {
    $active = (powercfg /getactivescheme) 2>&1
    Write-JsonResult @{
        dryRun = $true
        currentScheme = "$active"
        targetScheme = "High performance ($highPerfGuid)"
    }
    return
}

if (-not (Test-IsAdmin)) {
    Write-JsonResult @{ ok = $false; error = 'Administrator required' }
    exit 1
}

$out = powercfg /setactive $highPerfGuid 2>&1
Write-JsonResult @{ ok = $LASTEXITCODE -eq 0; output = "$out" }
