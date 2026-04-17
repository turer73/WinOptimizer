param([switch]$DryRun)
. "$PSScriptRoot\..\_Common.ps1"

$changes = @()
$changes += Set-RegistryValue -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\LocationAndSensors' -Name 'DisableLocation' -Value 1 -DryRun:$DryRun
$changes += Set-RegistryValue -Path 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\location' -Name 'Value' -Value 'Deny' -Type String -DryRun:$DryRun
$changes += Set-RegistryValue -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\location' -Name 'Value' -Value 'Deny' -Type String -DryRun:$DryRun

Write-JsonResult @{
    module = 'privacy'
    action = 'location'
    dryRun = [bool]$DryRun
    admin = Test-IsAdmin
    registry = $changes
}
