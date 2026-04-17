param([switch]$DryRun)
. "$PSScriptRoot\..\_Common.ps1"

$adapters = Get-NetAdapter -Physical | Where-Object { $_.Status -eq 'Up' }

$plan = @()
foreach ($a in $adapters) {
    $plan += @{
        adapter = $a.Name
        ifIndex = $a.ifIndex
        action = 'Reset to DHCP'
    }
}

if ($DryRun) {
    Write-JsonResult @{ dryRun = $true; plan = $plan }
    return
}

if (-not (Test-IsAdmin)) {
    Write-JsonResult @{ ok = $false; error = 'Administrator required' }
    exit 1
}

foreach ($a in $adapters) {
    Set-DnsClientServerAddress -InterfaceIndex $a.ifIndex -ResetServerAddresses
}

Write-JsonResult @{ ok = $true; plan = $plan }
