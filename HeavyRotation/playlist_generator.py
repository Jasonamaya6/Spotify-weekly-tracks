# playlist_generator.py
import spotipy
from spotipy.oauth2 import SpotifyOAuth
import config

# Initialize Spotify instance using the authenticated token
sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
    client_id=config.client_id,
    client_secret=config.client_secret,
    redirect_uri=config.redirect_uri,
    scope="user-top-read playlist-modify-public"
))


# Step 4: Create a Playlist and Add Top 25 Tracks

def create_playlist(tracks):
    """
    Create a new Spotify playlist and add the given tracks.
    :param tracks: List of Spotify track objects.
    :return: None
    """
    # 1. Get the user's Spotify ID
    user_id = sp.current_user()['id']

    # 2. Create a new playlist in the user's account
    playlist_name = "My Top 25 of the Week"
    playlist_description = "A personalized playlist of my top 25 songs of the week."
    new_playlist = sp.user_playlist_create(user=user_id, name=playlist_name, public=True,
                                           description=playlist_description)

    print(f"✅ Playlist '{playlist_name}' created successfully!")

    # 3. Extract track URIs from the track list
    track_uris = [track['uri'] for track in tracks]

    # 4. Add tracks to the newly created playlist
    sp.playlist_add_items(new_playlist['id'], track_uris)

    print(
        f"🎶 Added {len(track_uris)} tracks to the playlist '{playlist_name}'!")
    print(f"🌐 Playlist Link: {new_playlist['external_urls']['spotify']}")


# Main function to generate and save the playlist
def main():
    # Retrieve Top 25 Tracks (Using the same logic as Step 3)
    top_tracks = sp.current_user_top_tracks(limit=25, time_range='short_term')
    user_top_tracks = top_tracks['items']

    # Fallback: Fill in with medium_term tracks if needed
    if len(user_top_tracks) < 25:
        additional_tracks = sp.current_user_top_tracks(
            limit=25, time_range='medium_term')
        for item in additional_tracks['items']:
            if item not in user_top_tracks:  # Avoid duplicates
                user_top_tracks.append(item)
                if len(user_top_tracks) == 25:
                    break

    # Fallback: Use USA Top 100 Tracks if still under 25
    if len(user_top_tracks) < 25:
        usa_top_100_playlist_id = '37i9dQZEVXbLRQDuF5jeBp'
        playlist_tracks = sp.playlist_tracks(
            usa_top_100_playlist_id, limit=100)

        for item in playlist_tracks['items']:
            track = item['track']
            if track not in user_top_tracks:  # Avoid duplicates
                user_top_tracks.append(track)
                if len(user_top_tracks) == 25:
                    break

    # Create and save the playlist using the final track list
    create_playlist(user_top_tracks)


# Execute the main function
if __name__ == "__main__":
    main()
