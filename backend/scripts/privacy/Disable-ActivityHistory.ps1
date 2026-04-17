param([switch]$DryRun)
. "$PSScriptRoot\..\_Common.ps1"

$changes = @()
$changes += Set-RegistryValue -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\System' -Name 'EnableActivityFeed' -Value 0 -DryRun:$DryRun
$changes += Set-RegistryValue -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\System' -Name 'PublishUserActivities' -Value 0 -DryRun:$DryRun
$changes += Set-RegistryValue -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\System' -Name 'UploadUserActivities' -Value 0 -DryRun:$DryRun

Write-JsonResult @{
    module = 'privacy'
    action = 'activity'
    dryRun = [bool]$DryRun
    admin = Test-IsAdmin
    registry = $changes
}
