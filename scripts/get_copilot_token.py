import http.client
import json
import time

TIMEOUT = 10
CLIENT_ID = "Iv1.b507a08c87ecfe98"  # GitHub Copilot Plugin by GitHub


def get_token():
    # get login info
    conn = http.client.HTTPSConnection("github.com", timeout=TIMEOUT)
    headers = {
        "accept": "application/json",
        "content-type": "application/json"
    }
    body = {
        "client_id": CLIENT_ID,
        "scope": "read:user"
    }
    conn.request("POST", "/login/device/code", json.dumps(body), headers)
    resp = conn.getresponse()
    if resp.status != 200:
        raise Exception(f"Request failed with status {resp.status}: {resp.reason}")
    login_info = json.loads(resp.read().decode())

    print(f"Please open {login_info['verification_uri']} in browser and enter {login_info['user_code']} to login.")

    body = {
        "client_id": CLIENT_ID,
        "device_code": login_info['device_code'],
        "grant_type": "urn:ietf:params:oauth:grant-type:device_code"
    }
    while True:  # poll auth
        conn.request("POST", "/login/oauth/access_token", json.dumps(body), headers)
        resp = conn.getresponse()
        if resp.status != 200:
            raise Exception(f"Request failed with status {resp.status}: {resp.reason}")
        data = json.loads(resp.read().decode())
        if 'access_token' in resp:
            return data['access_token']
        elif data.get('error') == "authorization_pending":
            time.sleep(login_info['interval'])
        else:
            raise Exception(data['error_description'])


try:
    token = get_token()
except Exception as e:
    print(type(e).__name__, e)
else:
    print("Your token is:")
    print(token)
