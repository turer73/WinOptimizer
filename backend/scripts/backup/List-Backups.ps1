param([switch]$DryRun)
. "$PSScriptRoot\..\_Common.ps1"

$rootCandidate = Join-Path $PSScriptRoot '..\..\..\backups'
if (-not (Test-Path $rootCandidate)) { New-Item -ItemType Directory -Path $rootCandidate -Force | Out-Null }
$root = (Resolve-Path $rootCandidate).Path
$items = Get-ChildItem -Path $root -Directory -ErrorAction SilentlyContinue |
    ForEach-Object {
        @{
            name = $_.Name
            path = $_.FullName
            createdAt = $_.CreationTime.ToString('o')
            sizeBytes = (Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        }
    }

$restorePoints = @()
try {
    $restorePoints = Get-ComputerRestorePoint -ErrorAction SilentlyContinue | ForEach-Object {
        @{
            sequence = $_.SequenceNumber
            description = $_.Description
            createdAt = ([Management.ManagementDateTimeConverter]::ToDateTime($_.CreationTime)).ToString('o')
        }
    }
} catch {}

Write-JsonResult @{ backups = @($items); restorePoints = @($restorePoints) }
