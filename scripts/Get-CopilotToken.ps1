function getToken {
    $Timeout = 10
    $ClientId = "Iv1.b507a08c87ecfe98" # GitHub Copilot Plugin by GitHub
    # get login info
    $url = "https://github.com/login/device/code"
    $body = @{
        "client_id" = $ClientId
        "scope" = "read:user"
    }
    $headers = @{
        "accept" = "application/json"
        "content-type" = "application/json"
    }
    $loginInfo = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body (ConvertTo-Json $body) -TimeoutSec $Timeout

    Write-Host "Please open $($loginInfo.verification_uri) in browser and enter $($loginInfo.user_code) [copied in clipboard] to login."
    $loginInfo.user_code | Set-Clipboard
    Start-Sleep -Seconds 3
    Start-Process $loginInfo.verification_uri 

    $url = "https://github.com/login/oauth/access_token"
    $body = @{
        "client_id" = $ClientId
        "device_code" = $loginInfo.device_code
        "grant_type" = "urn:ietf:params:oauth:grant-type:device_code"
    }
    while ($true) { # poll auth
        $data = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body (ConvertTo-Json $body) -TimeoutSec $Timeout
        if ($data.access_token) {
            return $data.access_token
        } elseif ($data.error -eq "authorization_pending") {
            Start-Sleep -Seconds $loginInfo.interval
        } else {
            throw $data.error_description
        }
    }
}

try {
    $token = getToken
}
catch {
    Write-Host $_.Exception.GetType().Name $_.Exception.Message
    return
}
Write-Host "Your token is [copied to clipboard]:"
Write-Host $token
$token | Set-Clipboard
