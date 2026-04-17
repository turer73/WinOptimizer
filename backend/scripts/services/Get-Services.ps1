param([switch]$DryRun)
. "$PSScriptRoot\..\_Common.ps1"

$targets = @(
    'DiagTrack', 'dmwappushservice', 'WerSvc', 'RetailDemo',
    'MapsBroker', 'lfsvc', 'XblAuthManager', 'XblGameSave',
    'XboxGipSvc', 'XboxNetApiSvc', 'Fax', 'WSearch',
    'RemoteRegistry', 'RemoteAccess'
)

$list = foreach ($name in $targets) {
    $svc = Get-Service -Name $name -ErrorAction SilentlyContinue
    if ($svc) {
        @{
            name = $svc.Name
            displayName = $svc.DisplayName
            status = $svc.Status.ToString()
            startType = $svc.StartType.ToString()
            present = $true
        }
    } else {
        @{ name = $name; present = $false }
    }
}

Write-JsonResult @{
    module = 'services'
    action = 'list'
    services = @($list)
}
