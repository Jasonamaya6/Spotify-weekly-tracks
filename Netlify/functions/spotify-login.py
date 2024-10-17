import os
from urllib.parse import urlencode
from http.server import BaseHTTPRequestHandler

client_id = os.environ['SPOTIFY_CLIENT_ID']
redirect_uri = "https://heavyrotationspotify.netlify.app/.netlify/functions/callback"
scope = "user-top-read playlist-modify-public"


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Create the authorization URL to redirect to Spotify's login
        auth_url = "https://accounts.spotify.com/authorize?" + urlencode({
            "client_id": client_id,
            "response_type": "code",
            "redirect_uri": redirect_uri,
            "scope": scope
        })
        # Redirect user to the Spotify authorization page
        self.send_response(302)
        self.send_header('Location', auth_url)
        self.end_headers()
