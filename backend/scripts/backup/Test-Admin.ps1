param([switch]$DryRun)
. "$PSScriptRoot\..\_Common.ps1"

$result = [ordered]@{
    admin = Test-IsAdmin
    host = $env:COMPUTERNAME
    user = $env:USERNAME
    os = (Get-CimInstance Win32_OperatingSystem).Caption
    osBuild = [System.Environment]::OSVersion.Version.ToString()
    psVersion = $PSVersionTable.PSVersion.ToString()
}
Write-JsonResult $result
