param([switch]$DryRun)
. "$PSScriptRoot\..\_Common.ps1"

$changes = @()
$changes += Set-RegistryValue -Path 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\AdvertisingInfo' -Name 'Enabled' -Value 0 -DryRun:$DryRun
$changes += Set-RegistryValue -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\AdvertisingInfo' -Name 'DisabledByGroupPolicy' -Value 1 -DryRun:$DryRun

Write-JsonResult @{
    module = 'privacy'
    action = 'advertising'
    dryRun = [bool]$DryRun
    admin = Test-IsAdmin
    registry = $changes
}
