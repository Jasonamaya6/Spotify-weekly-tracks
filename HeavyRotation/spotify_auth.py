# Step 3: Filling in the Gaps to Ensure 25 Tracks
import spotipy
from spotipy.oauth2 import SpotifyOAuth
import config

# Reuse the authenticated Spotipy instance
sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
    client_id=config.client_id,
    client_secret=config.client_secret,
    redirect_uri=config.redirect_uri,
    scope="user-top-read"
))

# Retrieve Top 25 Tracks for the Week (already implemented)
top_tracks = sp.current_user_top_tracks(limit=25, time_range='short_term')
user_top_tracks = top_tracks['items']

# Fallback 1: Check if less than 25, fill with tracks from "medium_term" (past 6 months)
if len(user_top_tracks) < 25:
    additional_tracks = sp.current_user_top_tracks(limit=25, time_range='medium_term')
    for item in additional_tracks['items']:
        if item not in user_top_tracks:  # Avoid duplicate entries
            user_top_tracks.append(item)
            if len(user_top_tracks) == 25:
                break

if len(user_top_tracks) < 25:


    usa_top_100_playlist_id = '37i9dQZEVXbLRQDuF5jeBp'
    playlist_tracks = sp.playlist_tracks(usa_top_100_playlist_id, limit=100)

    for item in playlist_tracks['items']:
        track = item['track']
        if track not in user_top_tracks:  # Avoid duplicates
            user_top_tracks.append(track)
            if len(user_top_tracks) == 25:
                break





print("\n🎵 Final Top 25 Tracks for Your Playlist 🎵")
for idx, track in enumerate(user_top_tracks):
    track_name = track['name']
    artist_name = track['artists'][0]['name']
    print(f"{idx + 1}. {track_name} by {artist_name}")
