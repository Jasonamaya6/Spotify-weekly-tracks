import os
import requests
from urllib.parse import parse_qs
from http.server import BaseHTTPRequestHandler

client_id = os.environ['SPOTIFY_CLIENT_ID']
client_secret = os.environ['SPOTIFY_CLIENT_SECRET']
redirect_uri = "https://heavyrotationspotify.netlify.app/.netlify/functions/callback"


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse the query parameters (Spotify sends the authorization code as a query param)
        query_params = parse_qs(self.path[1:])
        if "code" in query_params:
            auth_code = query_params["code"][0]

            # Exchange the authorization code for an access token
            token_url = "https://accounts.spotify.com/api/token"
            token_data = {
                "grant_type": "authorization_code",
                "code": auth_code,
                "redirect_uri": redirect_uri,
                "client_id": client_id,
                "client_secret": client_secret
            }
            token_response = requests.post(token_url, data=token_data)
            token_info = token_response.json()

            # Extract access and refresh tokens
            access_token = token_info.get("access_token")
            refresh_token = token_info.get("refresh_token")

            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(
                f"Spotify authentication successful. Access token: {access_token}".encode())
        else:
            # Handle error (missing authorization code)
            self.send_response(400)
            self.end_headers()
