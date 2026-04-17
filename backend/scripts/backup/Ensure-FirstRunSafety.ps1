param([switch]$DryRun)
. "$PSScriptRoot\..\_Common.ps1"

# Mandatory first-run safety step:
# 1. Ensure System Protection is enabled on the system drive (turn it on if off).
# 2. Override the once-per-24h throttle so the checkpoint is guaranteed to be created.
# 3. Create a named restore point.
# 4. Restore the original throttle value.
#
# Returns a structured report so the UI can show exactly what happened.

$result = [ordered]@{
    module      = 'backup'
    action      = 'ensure-first-run-safety'
    dryRun      = [bool]$DryRun
    admin       = Test-IsAdmin
    systemDrive = $env:SystemDrive
    actions     = @()
    ok          = $true
}

if (-not (Test-IsAdmin) -and -not $DryRun) {
    $result.ok = $false
    $result.error = 'Administrator required. Re-launch WinOptimizer as Administrator.'
    Write-JsonResult $result
    exit 1
}

# --- Step 1: detect current System Restore status on SystemDrive ----------------
$srDrive = "$env:SystemDrive\"
$srEnabled = $false
try {
    # WMI SystemRestore.Enable is the cleanest detection that works on Win10/11.
    $existingPoints = Get-ComputerRestorePoint -ErrorAction SilentlyContinue
    # If we can list points without throwing, SR is queryable.
    $srEnabled = $existingPoints -ne $null -or $true  # default to "try to enable"
} catch {
    $srEnabled = $false
}

if ($DryRun) {
    $result.actions += [ordered]@{
        step    = 'Ensure-SystemProtection'
        drive   = $srDrive
        plan    = 'Would enable System Protection if disabled'
        dryRun  = $true
    }
    $result.actions += [ordered]@{
        step    = 'Create-RestorePoint'
        plan    = 'Would create checkpoint "WinOptimizer - First Run"'
        dryRun  = $true
    }
    Write-JsonResult $result
    return
}

# --- Step 2: enable System Protection (idempotent) -----------------------------
try {
    Enable-ComputerRestore -Drive $srDrive -ErrorAction Stop
    $result.actions += [ordered]@{
        step   = 'Enable-ComputerRestore'
        drive  = $srDrive
        ok     = $true
    }
} catch {
    $result.actions += [ordered]@{
        step   = 'Enable-ComputerRestore'
        drive  = $srDrive
        ok     = $false
        error  = $_.Exception.Message
    }
    # Non-fatal — Enable may fail with "already enabled" on some configs.
    # Continue and try to create the checkpoint anyway.
}

# --- Step 3: override 24h throttle -----------------------------------------------
$throttleKey = 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\SystemRestore'
$throttleName = 'SystemRestorePointCreationFrequency'
$previousThrottle = $null
$throttleExisted = $false
try {
    if (-not (Test-Path $throttleKey)) {
        New-Item -Path $throttleKey -Force | Out-Null
    }
    $existing = Get-ItemProperty -Path $throttleKey -Name $throttleName -ErrorAction SilentlyContinue
    if ($null -ne $existing) {
        $previousThrottle = $existing.$throttleName
        $throttleExisted = $true
    }
    New-ItemProperty -Path $throttleKey -Name $throttleName -Value 0 -PropertyType DWord -Force | Out-Null
    $result.actions += [ordered]@{
        step          = 'Throttle-Override'
        previousValue = $previousThrottle
        ok            = $true
    }
} catch {
    $result.actions += [ordered]@{
        step   = 'Throttle-Override'
        ok     = $false
        error  = $_.Exception.Message
    }
}

# --- Step 4: create the checkpoint ----------------------------------------------
$description = "WinOptimizer - First Run ($(Get-Date -Format 'yyyy-MM-dd HH:mm'))"
try {
    Checkpoint-Computer -Description $description -RestorePointType 'MODIFY_SETTINGS' -ErrorAction Stop
    $result.actions += [ordered]@{
        step        = 'Checkpoint-Computer'
        description = $description
        ok          = $true
    }
} catch {
    $result.ok = $false
    $result.actions += [ordered]@{
        step        = 'Checkpoint-Computer'
        description = $description
        ok          = $false
        error       = $_.Exception.Message
    }
}

# --- Step 5: restore throttle to its previous state -----------------------------
try {
    if ($throttleExisted) {
        New-ItemProperty -Path $throttleKey -Name $throttleName -Value $previousThrottle -PropertyType DWord -Force | Out-Null
    } else {
        Remove-ItemProperty -Path $throttleKey -Name $throttleName -ErrorAction SilentlyContinue
    }
    $result.actions += [ordered]@{
        step = 'Throttle-Restore'
        ok   = $true
    }
} catch {
    $result.actions += [ordered]@{
        step  = 'Throttle-Restore'
        ok    = $false
        error = $_.Exception.Message
    }
}

# --- Step 6: report the most recent restore point for confirmation --------------
try {
    $latest = Get-ComputerRestorePoint -ErrorAction SilentlyContinue | Sort-Object SequenceNumber -Descending | Select-Object -First 1
    if ($latest) {
        $result.latestRestorePoint = [ordered]@{
            sequence    = $latest.SequenceNumber
            description = $latest.Description
            createdAt   = ([Management.ManagementDateTimeConverter]::ToDateTime($latest.CreationTime)).ToString('o')
        }
    }
} catch {}

Write-JsonResult $result
