import json
import requests
import os
from spotipy import Spotify
from spotipy.oauth2 import SpotifyOAuth

# Make sure to include the environment variables for your Spotify credentials
def handler(event, context):
    try:
        # Get the access token from the query parameters in the HTTP request
        params = event.get("queryStringParameters", {})
        access_token = params.get("access_token")

        if not access_token:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Access token is missing from the request"})
            }

        # Step 1: Create the Spotify client
        sp = Spotify(auth=access_token)

        # Step 2: Fetch the user's top 25 tracks
        results = sp.current_user_top_tracks(limit=25, time_range='medium_term')
        tracks = [{"name": track["name"], "artist": track["artists"][0]["name"]} for track in results["items"]]

        # Step 3: Return the top tracks in the response
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Top 25 Tracks Retrieved Successfully!",
                "tracks": tracks
            })
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
