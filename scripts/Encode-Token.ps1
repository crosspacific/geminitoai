if($args.Count -lt 1) {
    Write-Host "Usage: $($MyInvocation.MyCommand.Name) <string to convert>"
    exit
}

[string]$Text = $args[0]

$Bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
$Base64 = [System.Convert]::ToBase64String($Bytes)

$output = "sk-" + $Base64.Replace('=', '')
$output|Set-Clipboard
Write-Host "Encoded token is: $output"
