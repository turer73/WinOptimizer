param([switch]$DryRun)
. "$PSScriptRoot\..\_Common.ps1"

# 2 = Adjust for best performance
$changes = @()
$changes += Set-RegistryValue -Path 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VisualEffects' -Name 'VisualFXSetting' -Value 2 -DryRun:$DryRun
$changes += Set-RegistryValue -Path 'HKCU:\Control Panel\Desktop' -Name 'UserPreferencesMask' -Value ([byte[]](0x90,0x12,0x03,0x80,0x10,0x00,0x00,0x00)) -Type Binary -DryRun:$DryRun
$changes += Set-RegistryValue -Path 'HKCU:\Control Panel\Desktop\WindowMetrics' -Name 'MinAnimate' -Value '0' -Type String -DryRun:$DryRun

Write-JsonResult @{
    module = 'performance'
    action = 'visual-effects'
    dryRun = [bool]$DryRun
    registry = $changes
}
