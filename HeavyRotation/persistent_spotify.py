# persistent_spotify.py
import spotipy
from spotipy.oauth2 import SpotifyOAuth
import config
import time

# Create the SpotifyOAuth instance with refresh token handling
sp_oauth = SpotifyOAuth(
    client_id=config.client_id,
    client_secret=config.client_secret,
    redirect_uri=config.redirect_uri,
    scope="user-top-read playlist-modify-public"
)

# Create a Spotipy instance with the authenticated credentials
sp = spotipy.Spotify(auth_manager=sp_oauth)


# Function to print current user's display name as a test
def print_user_info():
    user_info = sp.current_user()
    print(f"Successfully connected as: {user_info['display_name']}")


# Function to refresh the access token automatically
def ensure_token_freshness():
    token_info = sp_oauth.get_cached_token()

    if token_info:
        # Check if token is expired and refresh if needed
        if sp_oauth.is_token_expired(token_info):
            print("Access token expired. Refreshing now...")
            token_info = sp_oauth.refresh_access_token(token_info['refresh_token'])
            print(" Access token refreshed successfully!")

        # Set the new token in Spotipy
        sp.auth = token_info['access_token']
        return True
    else:
        print("No token found in cache. Please re-authenticate.")
        return False


# Test Function to Simulate Token Expiration and Refresh
def simulate_long_running_process():
    print_user_info()

    for _ in range(2):  # Simulate 2 cycles (about 2 hours in real time)
        print("\n Simulating 60 minutes passing (each loop)...")
        time.sleep(3)  # Shorten for demonstration purposes (e.g., 60 seconds)
        ensure_token_freshness()
        print(" Token refresh check complete.")
        print_user_info()


# Run the simulation
simulate_long_running_process()
