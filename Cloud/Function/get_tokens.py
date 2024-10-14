import json
import requests
import os

def handler(event, context):
    try:
        print("=== BEGIN HANDLER ===")
        params = event.get('queryStringParameters', {})
        code = params.get('code')
        print(f"Received code: {code}")

        client_id ="427c7f19a3df4702854e3986113db93d"
        client_secret ="c30180ee4889446eb2651fd32917af33"
        redirect_uri = "https://heavyrotation.netlify.app/callback"

        print(f"Client ID: {client_id}")
        print(f"Client Secret: {client_secret[:5]}...")  # Partial logging for security
        print(f"Redirect URI: {redirect_uri}")

        # Prepare the POST request payload
        token_url = "https://accounts.spotify.com/api/token"
        payload = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": client_id,
            "client_secret": client_secret,
        }

        print("Sending POST request to Spotify...")
        response = requests.post(token_url, data=payload)
        print(f"Response Status Code: {response.status_code}")
        print(f"Response Content: {response.text}")

        if response.status_code == 200:
            token_info = response.json()
            return {
                "statusCode": 200,
                "body": json.dumps({
                    "access_token": token_info['access_token'],
                    "refresh_token": token_info['refresh_token']
                })
            }
        else:
            print(f"Error from Spotify: {response.text}")
            return {
                "statusCode": response.status_code,
                "body": json.dumps({"error": response.text})
            }
    except Exception as e:
        print(f"Exception occurred: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
