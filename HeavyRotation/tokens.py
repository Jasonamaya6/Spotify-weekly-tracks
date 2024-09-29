import requests
import os
from dotenv import load_dotenv

# Load environment variables (Client ID and Client Secret)
load_dotenv()
client_id = "8f38ba76f6054919bbb67be5ccc30187"
client_secret = "aa31eb04e89a4394a41b59ae1f547264"

# Define your redirect URI and the authorization code obtained earlier
redirect_uri = "http://localhost:8888/callback"
authorization_code = input("Enter the authorization code you received: ")

# Prepare the POST request payload
token_url = "https://accounts.spotify.com/api/token"
payload = {
    "grant_type": "authorization_code",
    "code": authorization_code,
    "redirect_uri": redirect_uri,
    "client_id": client_id,
    "client_secret": client_secret,
}

# Make the POST request to get the access token
response = requests.post(token_url, data=payload)

# Check if the request was successful
if response.status_code == 200:
    token_info = response.json()
    access_token = token_info['access_token']
    refresh_token = token_info['refresh_token']  # Optional: Store this for refreshing the token later
    print(f"Access Token: {access_token}")
    print(f"Refresh Token: {refresh_token}")

    # Save tokens to a file for future use
    with open("spotify_tokens.txt", "w") as token_file:
        token_file.write(f"access_token={access_token}\n")
        token_file.write(f"refresh_token={refresh_token}\n")

    print("Tokens saved to 'spotify_tokens.txt'.")
else:
    print(f"Error: {response.status_code}, {response.text}")
