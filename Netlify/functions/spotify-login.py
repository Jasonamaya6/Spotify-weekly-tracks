import os
import json
from urllib.parse import urlencode
from http.server import BaseHTTPRequestHandler

# Spotify credentials
client_id = os.environ['SPOTIFY_CLIENT_ID']
redirect_uri = "https://your-netlify-site.netlify.app/.netlify/functions/callback"


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        scope = "user-top-read playlist-modify-public"
        auth_url = "https://accounts.spotify.com/authorize?" + urlencode({
            "client_id": client_id,
            "response_type": "code",
            "redirect_uri": redirect_uri,
            "scope": scope,
            "show_dialog": "true"
        })
        self.send_response(302)
        self.send_header('Location', auth_url)
        self.end_headers()
