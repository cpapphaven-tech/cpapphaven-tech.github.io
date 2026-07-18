import sys
import requests

USER_TOKEN = "EAAXXJXvw8e4BR9oCEE7x5NZCHloJ2rt9aaQgpciGT9VcFq1BAhBPW043tZBVd19rn6gfPpC7Ujz30wK1e2nXqmq58Ii7F4yNFtZALYkW8gSZCpqYxTm2aY58nn48HFi0X7uYX5TsWqK5VfBY2L0CXvyGVoBA67lWaCBzf8L3Ih4IbipXnpPASEhWmDlIK2G1JIt4gtojOxfpTRzdGaIT1NF4wBBXydhlD2Ak4X2u8cL8"

def main():
    # Check /me to see if this is already a page token
    me_url = "https://graph.facebook.com/v19.0/me"
    r = requests.get(me_url, params={"access_token": USER_TOKEN})
    me = r.json()
    print("Token identity:", me)
    
    # Also check scopes
    scope_url = "https://graph.facebook.com/v19.0/me/permissions"
    r2 = requests.get(scope_url, params={"access_token": USER_TOKEN})
    perms = r2.json()
    print("\nPermissions:")
    for p in perms.get("data", []):
        print(f"  {p.get('permission'):<35} {p.get('status')}")
    
    # Try /me/accounts if user token
    acc_url = "https://graph.facebook.com/v19.0/me/accounts"
    r3 = requests.get(acc_url, params={"access_token": USER_TOKEN})
    accs = r3.json()
    print("\nPages/Accounts:")
    for p in accs.get("data", []):
        print(f"  Name:  {p.get('name')}")
        print(f"  ID:    {p.get('id')}")
        print(f"  Tasks: {p.get('tasks')}")
        print(f"  Token: {p.get('access_token')}")

if __name__ == "__main__":
    main()
