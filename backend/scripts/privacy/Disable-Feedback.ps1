param([switch]$DryRun)
. "$PSScriptRoot\..\_Common.ps1"

$changes = @()
$changes += Set-RegistryValue -Path 'HKCU:\SOFTWARE\Microsoft\Siuf\Rules' -Name 'NumberOfSIUFInPeriod' -Value 0 -DryRun:$DryRun
$changes += Set-RegistryValue -Path 'HKCU:\SOFTWARE\Microsoft\Siuf\Rules' -Name 'PeriodInNanoSeconds' -Value 0 -DryRun:$DryRun
$changes += Set-RegistryValue -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\DataCollection' -Name 'DoNotShowFeedbackNotifications' -Value 1 -DryRun:$DryRun

Write-JsonResult @{
    module = 'privacy'
    action = 'feedback'
    dryRun = [bool]$DryRun
    admin = Test-IsAdmin
    registry = $changes
}
