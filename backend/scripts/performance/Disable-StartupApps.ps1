param([switch]$DryRun)
. "$PSScriptRoot\..\_Common.ps1"

# Report startup items only — disabling them safely requires user confirmation
# because third-party apps may re-enable themselves. We surface the list and
# do not auto-disable unknown entries.
$items = Get-CimInstance Win32_StartupCommand -ErrorAction SilentlyContinue |
    Select-Object Name, Command, Location, User

$list = @($items | ForEach-Object {
    @{
        name = $_.Name
        command = $_.Command
        location = $_.Location
        user = $_.User
    }
})

Write-JsonResult @{
    module = 'performance'
    action = 'startup-list'
    dryRun = $true
    note = 'This returns startup entries only. Disable per-item via Task Manager or a follow-up action.'
    items = $list
}
