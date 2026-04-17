param(
    [Parameter(Mandatory)][string]$Services,
    [switch]$DryRun
)
. "$PSScriptRoot\..\_Common.ps1"

$names = $Services -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ }
$results = @()

foreach ($name in $names) {
    $svc = Get-Service -Name $name -ErrorAction SilentlyContinue
    if (-not $svc) {
        $results += @{ name = $name; present = $false; dryRun = [bool]$DryRun }
        continue
    }

    $before = @{ status = $svc.Status.ToString(); startType = $svc.StartType.ToString() }

    if ($DryRun) {
        $results += @{
            name = $name
            present = $true
            before = $before
            after = @{ status = 'Stopped'; startType = 'Disabled' }
            dryRun = $true
        }
        continue
    }

    if (-not (Test-IsAdmin)) {
        $results += @{ name = $name; error = 'Administrator required'; dryRun = $false }
        continue
    }

    try {
        Stop-Service -Name $name -Force -ErrorAction SilentlyContinue
        Set-Service -Name $name -StartupType Disabled -ErrorAction Stop
        $after = Get-Service -Name $name
        $results += @{
            name = $name
            present = $true
            before = $before
            after = @{ status = $after.Status.ToString(); startType = $after.StartType.ToString() }
            dryRun = $false
        }
    } catch {
        $results += @{ name = $name; error = $_.Exception.Message; dryRun = $false }
    }
}

Write-JsonResult @{
    module = 'services'
    action = 'disable'
    dryRun = [bool]$DryRun
    admin = Test-IsAdmin
    results = $results
}
