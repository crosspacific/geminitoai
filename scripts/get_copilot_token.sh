#!/bin/bash

CLIENT_ID='Iv1.b507a08c87ecfe98' # GitHub Copilot Plugin by GitHub

if command -v jq >/dev/null 2>&1; then
  json_value() { #https://jqlang.github.io/jq/
    echo $1 | jq -r .$2
  }
else
  json_value() {
    echo $1 | grep -o "\"$2\":[^,]*" | cut -d ':' -f2 | tr -d '" ' | tr -d '}'
  }
fi

# get login info
if ! login_info=$(curl -LsSf -X POST \
  -H 'accept: application/json' \
  -H 'content-type: application/json' \
  -d '{"client_id": "'"$CLIENT_ID"'", "scope": "read:user"}' \
  'https://github.com/login/device/code')
then exit 1; fi

verification_uri=$(json_value "$login_info" verification_uri)
user_code=$(       json_value "$login_info" user_code)
device_code=$(     json_value "$login_info" device_code)
interval=$(        json_value "$login_info" interval)

echo "Please open $verification_uri in browser and enter $user_code to login"

# poll auth
while true;do 
  if ! data=$(curl -LsSf -X POST \
    -H 'accept: application/json' \
    -H 'content-type: application/json' \
    -d '{"client_id": "'"$CLIENT_ID"'", "device_code": "'"$device_code"'", "grant_type": "urn:ietf:params:oauth:grant-type:device_code"}' \
    'https://github.com/login/oauth/access_token')
  then exit 1; fi

  access_token=$(json_value "$data" access_token)
  if [ "$access_token" != "null" ] && [ "$access_token" != "" ]; then
    echo 'Your token is:'
    echo $access_token
    break
  elif [ "$(json_value "$data" error)" = "authorization_pending" ]; then
    sleep $interval
  else
    echo "Error: $(json_value "$data" error_description)"
    break
  fi
done
