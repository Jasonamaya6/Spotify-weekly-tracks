const querystring = require('querystring');
const fetch = require('node-fetch');

// Function to generate dynamic description
function generateDynamicDescription() {
    const descriptions = [
        "Believe you can baby and you're halfway there.....",
        "Your time is limited, don't waste it living someone else's life. Beautiful quote by Steve Jobs.",
        "Trust in the Lord with all your heart and lean not on your own understanding... – Proverbs 3:5-6",
        "Be strong and courageous... – Joshua 1:9",
        "If you're feeling down this week, just know everything will be okay...",
        "Share one strong, positive word with me, and together we’ll live by it for the week.",
        "Great things never come from comfort zones. Keep pushing forward...",
        "Set and accomplish an uncomfortable goal this week!",
        "Life is a journey, not a race. Embrace every moment...",
        "Slowwwwwwwwwwwww down... life is chillllllllllllll... Apreciate what these moments dont worry about the future",
        "Open Arms better be in the list this week.",
        "Text someone you love!",
        "Set a goal, use music as motivation, and get this money!",
        "Don’t forget to smile this week! Love U.",
        "This week, compliment the people around you—they'll appreciate it!",
        "SMILE! Because you are able-bodied.",
        "You are perfect in every way.",
        "This is the last quote, but our love story will never end!"
    ];
    const randomIndex = Math.floor(Math.random() * descriptions.length);
    return descriptions[randomIndex];
}

// Function to handle the Spotify API token exchange
exports.handler = async function(event) {
    try {
        // Get the authorization code from the query parameters
        const code = event.queryStringParameters.code;

        // Step 1: Exchange the authorization code for an access token
        const tokenUrl = 'https://accounts.spotify.com/api/token';
        const body = querystring.stringify({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: 'https://heavyrotationspotify.netlify.app/.netlify/functions/callback',  // Ensure this matches exactly
            client_id: process.env.SPOTIFY_CLIENT_ID,
            client_secret: process.env.SPOTIFY_CLIENT_SECRET,
        });

        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error exchanging authorization code: ", errorText);  // Log the error
            return {
                statusCode: 500,
                body: `Error exchanging authorization code: ${errorText}`
            };
        }

        const tokenData = await response.json();
        const access_token = tokenData.access_token;

        // Step 2: Fetch the user's top tracks using the access token
        const topTracksData = await fetchTopTracks(access_token, 'short_term', 25);
        let trackUris = topTracksData.items.map(track => track.uri);

        // Step 3: (Optional Fallback) Fetch top tracks from the USA Top 100 if the user's tracks are fewer than 25
        if (trackUris.length < 25) {
            const usa_top_100_playlist_id = '37i9dQZEVXbLRQDuF5jeBp';  // Example: USA Top 100 Playlist ID
            const playlistTracksData = await fetchPlaylistTracks(access_token, usa_top_100_playlist_id, 100);
            
            for (let item of playlistTracksData.items) {
                const track = item.track.uri;
                if (!trackUris.includes(track)) {
                    trackUris.push(track);
                    if (trackUris.length === 25) break;  // Stop once we have 25 tracks
                }
            }
        }

        // Step 4: Create a new playlist and add tracks
        const createPlaylistUrl = 'https://api.spotify.com/v1/me/playlists';
        const playlistResponse = await fetch(createPlaylistUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Love U ❤️',
                description: generateDynamicDescription(),
                public: true
            })
        });

        if (!playlistResponse.ok) {
            const errorText = await playlistResponse.text();
            console.error("Failed to create playlist: ", errorText);  // Log the error
            return {
                statusCode: 500,
                body: `Failed to create playlist: ${errorText}`
            };
        }

        const playlistData = await playlistResponse.json();
        const playlistId = playlistData.id;

        // Step 5: Add tracks to the playlist
        const addTracksResult = await addTracksToPlaylist(access_token, playlistId, trackUris);

        // Step 6: Return a success response to the user
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html' },
            body: `
                <html>
                <head><title>Your Special Playlist is Ready!</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; background-color: #fff0f5; color: #333;">
                    <h1 style="color: #ff69b4; font-size: 48px;">Your Playlist is Ready, Love!</h1>
                    <p style="font-size: 22px; color: #333;">
                        I have created something just for you a playlist that will grow with songs you are loving! 
                        I hope every track brings a smile to your face and reminds you of our special moments.
                        LOVE U !!!! 
                        <br><br>
                        <a href="${playlistData.external_urls.spotify}" target="_blank" style="font-size: 20px; color: #ff69b4; text-decoration: none;">
                            Click here bbg! 
                        </a>
                    </p>
                    <p style="font-size: 18px; color: #333;">With all my love, always.</p>
                </body>
                </html>
            `,
        };
        

    } catch (error) {
        console.error("Unexpected error: ", error);  // Catch any other unexpected errors
        return {
            statusCode: 500,
            body: `Unexpected error: ${error.message}`
        };
    }
};

// Helper function to fetch the user's top tracks
async function fetchTopTracks(access_token, time_range, limit) {
    const topTracksUrl = `https://api.spotify.com/v1/me/top/tracks?time_range=${time_range}&limit=${limit}`;
    const response = await fetch(topTracksUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${access_token}` }
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch top tracks: ", errorText);  // Log the error if the request fails
        throw new Error(`Failed to fetch top tracks: ${errorText}`);
    }

    return await response.json();
}

// Helper function to fetch tracks from a specific playlist (fallback if needed)
async function fetchPlaylistTracks(access_token, playlist_id, limit) {
    const playlistTracksUrl = `https://api.spotify.com/v1/playlists/${playlist_id}/tracks?limit=${limit}`;
    const response = await fetch(playlistTracksUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${access_token}` }
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch playlist tracks: ", errorText);  // Log the error if the request fails
        throw new Error(`Failed to fetch playlist tracks: ${errorText}`);
    }

    return await response.json();
}

// Function to add tracks to the playlist
async function addTracksToPlaylist(access_token, playlistId, trackUris) {
    const addTracksUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    const addTracksResponse = await fetch(addTracksUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uris: trackUris })
    });

    if (!addTracksResponse.ok) {
        const errorText = await addTracksResponse.text();
        console.error("Failed to add tracks to the playlist:", errorText);
        throw new Error("Failed to add tracks to the playlist.");
    }

    return await addTracksResponse.json();
}
