# Spotify Weekly Top Tracks Playlist Creator 🎵

## Project Overview

This project is an integration with the Spotify API that generates a personalized playlist titled "My Top 25 of the Week" based on the user’s listening history. The playlist features the top 25 tracks for the past week and supplements it with tracks from a longer timeframe or the Top 100 USA if there are not enough tracks available.

The project will eventually be hosted on a Netlify-powered website to provide a user-friendly interface, making it easy for anyone with a Spotify account to create and access their weekly playlists. Currently, it is still under development and testing.

## Approach
Setup Authentication:

Register the Spotify application on the Spotify Developer Dashboard to obtain Client ID, Client Secret, and Redirect URI.
Configure Spotipy with OAuth2, requesting the user-top-read permission to access the user’s top tracks.
Retrieve User's Top Tracks:

Request the top 25 tracks for the current week using time_range='short_term'.
If less than 25 tracks are available:
Retrieve additional tracks from a longer timeframe (time_range='medium_term').
If the total is still less than 25, supplement with trending songs from the Top 100 USA.
Create a New Playlist:

Create a new playlist titled "My Top 25 of the Week".
Populate the playlist with the collected top tracks.
Future Deployment on Netlify:

The project will be accessible through a web-based interface where users can log in with their Spotify accounts.
The interface will allow users to create the playlist with a single click, directly from the web.
Error Handling & Reporting:

Handle errors such as authentication failures or API request issues.
Display success messages when the playlist is successfully generated or error messages when issues are encountered.
Project Status
🚧 Under Construction: This project is currently in the development phase and will be hosted on a Netlify website soon, providing an easy-to-use interface for Spotify users. Until then, the project can be run locally as a Python script.

## Features
🟢 Personalized Playlist Creation: Automatically creates a playlist with your top 25 tracks every week.
🔄 Dynamic Track Fetching: If your weekly history is insufficient, the program will fetch tracks from your broader listening history.
🎧 Top Charts Supplementation: If your listening history is limited, the project will supplement the playlist with trending tracks from the Top 100 USA.

## Tech Stack
Python
Spotipy: Python library for the Spotify Web API
Spotify Web API: For fetching user data and managing playlists
OAuth2: For secure access to user data
Netlify (Future Hosting)
