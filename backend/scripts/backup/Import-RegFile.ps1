param(
    [Parameter(Mandatory)][string]$Folder,
    [Parameter(Mandatory)][string]$File,
    [switch]$DryRun
)
. "$PSScriptRoot\..\_Common.ps1"

$rootCandidate = Join-Path $PSScriptRoot '..\..\..\backups'
$backupsRoot = (Resolve-Path $rootCandidate).Path

$safeFolder = [System.IO.Path]::GetFileName($Folder)
$safeFile = [System.IO.Path]::GetFileName($File)

if (-not $safeFile.EndsWith('.reg')) {
    Write-JsonResult @{ ok = $false; error = 'File must have .reg extension' }
    exit 1
}

$target = Join-Path (Join-Path $backupsRoot $safeFolder) $safeFile
if (-not (Test-Path $target)) {
    Write-JsonResult @{ ok = $false; error = "Reg file not found: $target" }
    exit 1
}

if ($DryRun) {
    Write-JsonResult @{
        dryRun = $true
        file = $target
        sizeBytes = (Get-Item $target).Length
        note = 'reg.exe import would merge this .reg file into the registry.'
    }
    return
}

if (-not (Test-IsAdmin)) {
    Write-JsonResult @{ ok = $false; error = 'Administrator required for reg import' }
    exit 1
}

$proc = Start-Process -FilePath 'reg.exe' -ArgumentList @('import', $target) -Wait -NoNewWindow -PassThru
Write-JsonResult @{
    ok = ($proc.ExitCode -eq 0)
    exitCode = $proc.ExitCode
    file = $target
}
