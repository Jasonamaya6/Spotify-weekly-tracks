import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
client_id = "8f38ba76f6054919bbb67be5ccc30187"
client_secret = "aa31eb04e89a4394a41b59ae1f547264"


# Load the access token and refresh token from the saved file
def load_tokens():
    with open("spotify_tokens.txt", "r") as file:
        tokens = {}
        lines = file.readlines()
        for line in lines:
            key, value = line.strip().split("=")
            tokens[key] = value
        return tokens


# Save new tokens to the file
def save_tokens(access_token, refresh_token):
    with open("spotify_tokens.txt", "w") as file:
        file.write(f"access_token={access_token}\n")
        file.write(f"refresh_token={refresh_token}\n")


# Refresh the access token using the refresh token
def refresh_access_token(refresh_token):
    token_url = "https://accounts.spotify.com/api/token"
    payload = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": client_id,
        "client_secret": client_secret
    }

    response = requests.post(token_url, data=payload)
    if response.status_code == 200:
        token_info = response.json()
        new_access_token = token_info['access_token']
        return new_access_token
    else:
        print(f"Error refreshing token: {response.status_code}, {response.text}")
        return None


# Fetch the user's top 8 tracks
def get_user_top_tracks(access_token):
    top_tracks_endpoint = "https://api.spotify.com/v1/me/top/tracks"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    params = {
        "limit": 25,
        "time_range": "short_term"
    }

    response = requests.get(top_tracks_endpoint, headers=headers, params=params)
    if response.status_code == 200:
        return response.json()['items']
    else:
        print(f"Error: {response.status_code}, {response.text}")
        return []


def get_top_tracks_from_usa(access_token, count):
    # USA Top 50 Playlist ID
    usa_top_50_id = "37i9dQZEVXbLRQDuF5jeBp"
    playlist_tracks_endpoint = f"https://api.spotify.com/v1/playlists/{usa_top_50_id}/tracks"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    params = {
        "limit": count
    }

    response = requests.get(playlist_tracks_endpoint, headers=headers, params=params)
    if response.status_code == 200:
        playlist_items = response.json()['items']
        # Extract only the track name and artist from the playlist
        return [(item['track']['name'], item['track']['artists'][0]['name']) for item in playlist_items]
    else:
        print(f"Error fetching USA Top 50 tracks: {response.status_code}, {response.text}")
        return []


# Main function to get top tracks
def get_top_tracks():
    tokens = load_tokens()
    access_token = tokens['access_token']
    refresh_token = tokens['refresh_token']

    # If the access token is expired, refresh it
    access_token = refresh_access_token(refresh_token)

    if access_token:
        save_tokens(access_token, refresh_token)  # Save the new access token

        user_top_tracks = get_user_top_tracks(access_token)

        if len(user_top_tracks) < 25:
            missing_count = 25 - len(user_top_tracks)
            print(f"User has only {len(user_top_tracks)} top tracks. Adding {missing_count} more from the USA Top 50.")
            usa_top_tracks = get_top_tracks_from_usa(access_token, missing_count)

            user_top_tracks.extend(usa_top_tracks)

        # Print the final list of top tracks
        print("Top 25 Tracks for the Current Week:")
        for idx, track in enumerate(user_top_tracks):
            # If track is a Spotify track, format it accordingly
            if isinstance(track, dict):
                track_name = track['name']
                artist_name = track['artists'][0]['name']
            else:  # If track is from USA Top 50 (tuple)
                track_name, artist_name = track
            print(f"{idx + 1}. {track_name} by {artist_name}")
    else:
        print("Could not refresh the access token.")


# Run the function to get top tracks
if __name__ == "__main__":
    get_top_tracks()
