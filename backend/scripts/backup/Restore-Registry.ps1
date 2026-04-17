param(
    [Parameter(Mandatory)][string]$Folder,
    [switch]$DryRun
)
. "$PSScriptRoot\..\_Common.ps1"

# Resolve the backup folder path safely: accept either a relative name
# (e.g. "20260417") or an absolute path. Refuse anything that escapes
# the backups root to prevent path traversal.
$rootCandidate = Join-Path $PSScriptRoot '..\..\..\backups'
if (-not (Test-Path $rootCandidate)) { New-Item -ItemType Directory -Path $rootCandidate -Force | Out-Null }
$backupsRoot = (Resolve-Path $rootCandidate).Path

if ([System.IO.Path]::IsPathRooted($Folder)) {
    $target = (Resolve-Path $Folder -ErrorAction SilentlyContinue)
    if (-not $target) {
        Write-JsonResult @{ ok = $false; error = "Folder not found: $Folder" }
        exit 1
    }
    $target = $target.Path
} else {
    $safeName = [System.IO.Path]::GetFileName($Folder)
    $target = Join-Path $backupsRoot $safeName
    if (-not (Test-Path $target)) {
        Write-JsonResult @{ ok = $false; error = "Folder not found: $target" }
        exit 1
    }
}

# Defence: ensure resolved folder stays under backups root.
if (-not $target.StartsWith($backupsRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    Write-JsonResult @{ ok = $false; error = "Folder outside backups root: $target" }
    exit 1
}

$entries = Get-ChildItem -Path $target -Filter 'reg-*.json' -File -ErrorAction SilentlyContinue
if (-not $entries -or $entries.Count -eq 0) {
    Write-JsonResult @{ ok = $false; error = "No registry backup entries (reg-*.json) in $target" }
    exit 1
}

$results = @()
foreach ($file in $entries) {
    try {
        $entry = Get-Content -Path $file.FullName -Raw | ConvertFrom-Json
    } catch {
        $results += @{ file = $file.Name; ok = $false; error = "Parse error: $($_.Exception.Message)" }
        continue
    }

    $path = $entry.path
    $name = $entry.name
    $record = @{
        file = $file.Name
        path = $path
        name = $name
        existedOriginally = [bool]$entry.existed
        originalValue = $entry.value
        dryRun = [bool]$DryRun
    }

    # Read current state
    $currentExists = $false
    $currentValue = $null
    try {
        $currentValue = (Get-ItemProperty -Path $path -Name $name -ErrorAction Stop).$name
        $currentExists = $true
    } catch {}

    $record.currentValue = $currentValue
    $record.currentExists = $currentExists

    if ($entry.existed -eq $true) {
        # Value existed originally — restore it
        if ($DryRun) {
            $record.action = 'would-restore'
            $results += $record
            continue
        }
        try {
            if (-not (Test-Path $path)) { New-Item -Path $path -Force | Out-Null }
            New-ItemProperty -Path $path -Name $name -Value $entry.value -Force | Out-Null
            $record.action = 'restored'
            $record.ok = $true
        } catch {
            $record.action = 'error'
            $record.ok = $false
            $record.error = $_.Exception.Message
        }
    } else {
        # Value did NOT exist originally — we should remove it if it exists now
        if (-not $currentExists) {
            $record.action = 'no-op'
            $record.ok = $true
            $results += $record
            continue
        }
        if ($DryRun) {
            $record.action = 'would-remove'
            $results += $record
            continue
        }
        try {
            Remove-ItemProperty -Path $path -Name $name -Force -ErrorAction Stop
            $record.action = 'removed'
            $record.ok = $true
        } catch {
            $record.action = 'error'
            $record.ok = $false
            $record.error = $_.Exception.Message
        }
    }

    $results += $record
}

$okCount = ($results | Where-Object { $_.ok -eq $true -or $_.action -in 'would-restore','would-remove','no-op' }).Count

Write-JsonResult @{
    module = 'backup'
    action = 'restore'
    folder = $target
    dryRun = [bool]$DryRun
    admin = Test-IsAdmin
    total = $results.Count
    successful = $okCount
    results = $results
}
