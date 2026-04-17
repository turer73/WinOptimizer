param([switch]$DryRun)
. "$PSScriptRoot\..\_Common.ps1"

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$rootCandidate = Join-Path $PSScriptRoot '..\..\..\backups'
if (-not (Test-Path $rootCandidate)) { New-Item -ItemType Directory -Path $rootCandidate -Force | Out-Null }
$root = (Resolve-Path $rootCandidate).Path
$dir = Join-Path $root "export-$stamp"

if ($DryRun) {
    Write-JsonResult @{ dryRun = $true; target = $dir }
    return
}

New-Item -ItemType Directory -Path $dir -Force | Out-Null

# Export key registry hives relevant to privacy/debloat
$exports = @(
    @{ key = 'HKLM\SOFTWARE\Policies\Microsoft\Windows'; file = 'policies.reg' }
    @{ key = 'HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\AdvertisingInfo'; file = 'advertising.reg' }
    @{ key = 'HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Search'; file = 'search.reg' }
    @{ key = 'HKLM\SYSTEM\CurrentControlSet\Services'; file = 'services.reg' }
)

$regResults = @()
foreach ($e in $exports) {
    $target = Join-Path $dir $e.file
    $proc = Start-Process -FilePath 'reg.exe' -ArgumentList @('export', $e.key, $target, '/y') -Wait -NoNewWindow -PassThru
    $regResults += @{ key = $e.key; file = $e.file; ok = ($proc.ExitCode -eq 0) }
}

# AppX package inventory
Get-AppxPackage -AllUsers | Select-Object Name, PackageFullName, Publisher, Version |
    Export-Csv -Path (Join-Path $dir 'appx.csv') -NoTypeInformation -Encoding UTF8

# Services inventory
Get-Service | Select-Object Name, DisplayName, Status, StartType |
    Export-Csv -Path (Join-Path $dir 'services.csv') -NoTypeInformation -Encoding UTF8

# Startup programs
Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location, User |
    Export-Csv -Path (Join-Path $dir 'startup.csv') -NoTypeInformation -Encoding UTF8

Write-JsonResult @{
    dryRun = $false
    directory = $dir
    registryExports = $regResults
    appxFile = 'appx.csv'
    servicesFile = 'services.csv'
    startupFile = 'startup.csv'
}
