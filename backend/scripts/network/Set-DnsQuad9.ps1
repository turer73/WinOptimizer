param([switch]$DryRun)
. "$PSScriptRoot\..\_Common.ps1"

$dns = @('9.9.9.9', '149.112.112.112')
$v6 = @('2620:fe::fe', '2620:fe::9')

$adapters = Get-NetAdapter -Physical | Where-Object { $_.Status -eq 'Up' }

$plan = @()
foreach ($a in $adapters) {
    $currentV4 = (Get-DnsClientServerAddress -InterfaceIndex $a.ifIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue).ServerAddresses
    $currentV6 = (Get-DnsClientServerAddress -InterfaceIndex $a.ifIndex -AddressFamily IPv6 -ErrorAction SilentlyContinue).ServerAddresses
    $plan += @{
        adapter = $a.Name
        ifIndex = $a.ifIndex
        beforeV4 = @($currentV4)
        beforeV6 = @($currentV6)
        afterV4 = $dns
        afterV6 = $v6
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
    Set-DnsClientServerAddress -InterfaceIndex $a.ifIndex -ServerAddresses ($dns + $v6)
}

Write-JsonResult @{ ok = $true; plan = $plan }
