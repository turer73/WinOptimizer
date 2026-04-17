# Shared helpers for all WinOptimizer PowerShell scripts.
# Dot-source this from every script: . "$PSScriptRoot\..\_Common.ps1"

$ErrorActionPreference = 'Stop'

function Test-IsAdmin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-BackupDir {
    # $PSScriptRoot here is the folder containing _Common.ps1 (backend\scripts),
    # so backups/ is two levels up.
    $candidate = Join-Path $PSScriptRoot '..\..\backups'
    if (-not (Test-Path $candidate)) {
        New-Item -ItemType Directory -Path $candidate -Force | Out-Null
    }
    $root = (Resolve-Path $candidate).Path
    $stamp = Get-Date -Format 'yyyyMMdd'
    $dir = Join-Path $root $stamp
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    return $dir
}

function Save-RegistryValue {
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][string]$Name
    )
    try {
        $item = Get-ItemProperty -Path $Path -Name $Name -ErrorAction Stop
        $value = $item.$Name
        $backup = @{
            path = $Path
            name = $Name
            value = $value
            existed = $true
            timestamp = (Get-Date).ToString('o')
        }
    } catch {
        $backup = @{
            path = $Path
            name = $Name
            value = $null
            existed = $false
            timestamp = (Get-Date).ToString('o')
        }
    }
    $file = Join-Path (Get-BackupDir) ('reg-' + ([System.Guid]::NewGuid().ToString('N').Substring(0,8)) + '.json')
    $backup | ConvertTo-Json -Depth 5 | Set-Content -Path $file -Encoding UTF8
    return $backup
}

function Set-RegistryValue {
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)]$Value,
        [string]$Type = 'DWord',
        [switch]$DryRun
    )

    $before = Save-RegistryValue -Path $Path -Name $Name
    $changeNeeded = $before.existed -eq $false -or $before.value -ne $Value

    if ($DryRun) {
        return [pscustomobject]@{
            path = $Path
            name = $Name
            before = $before.value
            after = $Value
            existed = $before.existed
            changed = $changeNeeded
            dryRun = $true
        }
    }

    if (-not (Test-Path $Path)) {
        New-Item -Path $Path -Force | Out-Null
    }

    if ($changeNeeded) {
        New-ItemProperty -Path $Path -Name $Name -Value $Value -PropertyType $Type -Force | Out-Null
    }

    return [pscustomobject]@{
        path = $Path
        name = $Name
        before = $before.value
        after = $Value
        existed = $before.existed
        changed = $changeNeeded
        dryRun = $false
    }
}

function Write-JsonResult {
    param([Parameter(Mandatory)]$Payload)
    $Payload | ConvertTo-Json -Depth 10 -Compress
}
