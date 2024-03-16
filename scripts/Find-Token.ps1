$hostsFile = "$env:LOCALAPPDATA\github-copilot\hosts.json"
$tokenFile = "$env:HOMEDRIVE$env:HOMEPATH\.copilot-cli-access-token"

if (Test-Path $hostsFile) {
    Write-Output "Found hosts.json:"
    Get-Content $hostsFile
} else {
    Write-Output "hosts.json not found."
}

Write-Output ""

if (Test-Path $tokenFile) {
    Write-Output "Found .copilot-cli-access-token:"
    Get-Content $tokenFile
} else {
    Write-Output ".copilot-cli-access-token not found."
}
