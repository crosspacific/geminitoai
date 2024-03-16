@echo off
setlocal

set "HOSTS_FILE=%LOCALAPPDATA%\github-copilot\hosts.json"
set "TOKEN_FILE=%HOMEDRIVE%%HOMEPATH%\.copilot-cli-access-token"

if exist "%HOSTS_FILE%" (
    echo Found hosts.json:
    type "%HOSTS_FILE%"
) else (
    echo hosts.json not found.
)

echo.

if exist "%TOKEN_FILE%" (
    echo Found .copilot-cli-access-token:
    type "%TOKEN_FILE%"
) else (
    echo .copilot-cli-access-token not found.
)

endlocal
