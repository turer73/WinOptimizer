param([switch]$DryRun)
. "$PSScriptRoot\..\_Common.ps1"

$changes = @()
$changes += Set-RegistryValue -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\DataCollection' -Name 'AllowTelemetry' -Value 0 -DryRun:$DryRun
$changes += Set-RegistryValue -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\DataCollection' -Name 'AllowTelemetry' -Value 0 -DryRun:$DryRun
$changes += Set-RegistryValue -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\DataCollection' -Name 'DoNotShowFeedbackNotifications' -Value 1 -DryRun:$DryRun

# DiagTrack service
$svcChange = $null
try {
    $svc = Get-Service -Name 'DiagTrack' -ErrorAction Stop
    $before = @{ status = $svc.Status.ToString(); startType = $svc.StartType.ToString() }
    if (-not $DryRun -and (Test-IsAdmin)) {
        Stop-Service -Name 'DiagTrack' -Force -ErrorAction SilentlyContinue
        Set-Service -Name 'DiagTrack' -StartupType Disabled
    }
    $svcChange = @{ name = 'DiagTrack'; before = $before; after = @{ status = 'Stopped'; startType = 'Disabled' }; dryRun = [bool]$DryRun }
} catch {
    $svcChange = @{ name = 'DiagTrack'; error = $_.Exception.Message }
}

Write-JsonResult @{
    module = 'privacy'
    action = 'telemetry'
    dryRun = [bool]$DryRun
    admin = Test-IsAdmin
    registry = $changes
    service = $svcChange
}
