param([switch]$DryRun)
. "$PSScriptRoot\..\_Common.ps1"

$apps = Get-AppxPackage -AllUsers -ErrorAction SilentlyContinue |
    Select-Object Name, PackageFullName, Publisher, Version, IsBundle, IsFramework |
    Sort-Object Name

$list = @($apps | ForEach-Object {
    @{
        name = $_.Name
        packageFullName = $_.PackageFullName
        publisher = $_.Publisher
        version = $_.Version.ToString()
        isFramework = [bool]$_.IsFramework
    }
})

Write-JsonResult @{
    module = 'bloatware'
    action = 'list'
    count = $list.Count
    apps = $list
}
