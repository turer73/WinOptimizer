param(
    [Parameter(Mandatory)][string]$Apps,
    [switch]$DryRun
)
. "$PSScriptRoot\..\_Common.ps1"

$names = $Apps -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ }

$results = @()
foreach ($name in $names) {
    $pkgs = @(Get-AppxPackage -AllUsers -Name $name -ErrorAction SilentlyContinue)
    $prov = @(Get-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -eq $name })

    $entry = @{
        name = $name
        foundInstalled = $pkgs.Count
        foundProvisioned = $prov.Count
        removedInstalled = 0
        removedProvisioned = 0
        dryRun = [bool]$DryRun
        errors = @()
    }

    if (-not $DryRun) {
        foreach ($p in $pkgs) {
            try {
                Remove-AppxPackage -Package $p.PackageFullName -AllUsers -ErrorAction Stop
                $entry.removedInstalled++
            } catch {
                $entry.errors += "$($p.PackageFullName): $($_.Exception.Message)"
            }
        }
        foreach ($p in $prov) {
            try {
                Remove-AppxProvisionedPackage -Online -PackageName $p.PackageName -ErrorAction Stop | Out-Null
                $entry.removedProvisioned++
            } catch {
                $entry.errors += "$($p.PackageName): $($_.Exception.Message)"
            }
        }
    }

    $results += $entry
}

Write-JsonResult @{
    module = 'bloatware'
    action = 'remove'
    dryRun = [bool]$DryRun
    admin = Test-IsAdmin
    results = $results
}
