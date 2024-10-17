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
        "Slow down... life is chill...",
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

// Function to fetch top tracks for a specific time range (last 4 weeks)
async function fetchTopTracks(access_token, time_range, limit) {
    const topTracksUrl = `https://api.spotify.com/v1/me/top/tracks?time_range=${time_range}&limit=${limit}`;
    const response = await fetch(topTracksUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${access_token}` }
    });

    if (!response.ok) {
        console.error("Failed to fetch top tracks:", await response.text());
        throw new Error("Failed to fetch top tracks.");
    }

    return await response.json();
}

// Function to fetch tracks from a specific playlist (e.g., USA Top 100)
async function fetchPlaylistTracks(access_token, playlist_id, limit) {
    const playlistTracksUrl = `https://api.spotify.com/v1/playlists/${playlist_id}/tracks?limit=${limit}`;
    const response = await fetch(playlistTracksUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${access_token}` }
    });

    if (!response.ok) {
        console.error("Failed to fetch playlist tracks:", await response.text());
        throw new Error("Failed to fetch playlist tracks.");
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
        console.error("Failed to add tracks to the playlist:", await addTracksResponse.text());
        throw new Error("Failed to add tracks to the playlist.");
    }

    return addTracksResponse.json();
}

exports.handler = async function(event, context) {
    const client_id = process.env.SPOTIFY_CLIENT_ID;
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirect_uri = 'https://heavyrotationspotify.netlify.app/.netlify/functions/callback';
    
    const usa_top_100_playlist_id = '37i9dQZEVXbLRQDuF5jeBp';  // USA Top 100 Playlist ID

    // Get authorization code from query parameters
    const code = event.queryStringParameters.code;

    // Exchange authorization code for access token
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const body = querystring.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirect_uri,
        client_id: client_id,
        client_secret: client_secret,
    });

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body,
    });

    if (!response.ok) {
        console.error("Failed to exchange authorization code for access token:", await response.text());
        throw new Error("Failed to exchange authorization code.");
    }

    const tokenData = await response.json();
    const access_token = tokenData.access_token;

    // Step 1: Get the user's top 25 most played tracks of the last 4 weeks
    const topTracksData = await fetchTopTracks(access_token, 'short_term', 25);
    let trackUris = topTracksData.items.map(track => track.uri);  // Extract track URIs

    // Step 2: Fallback - If fewer than 25 tracks, use tracks from the USA Top 100 playlist
    if (trackUris.length < 25) {
        const playlistTracksData = await fetchPlaylistTracks(access_token, usa_top_100_playlist_id, 100);
        for (let item of playlistTracksData.items) {
            const track = item.track.uri; 
            if (!trackUris.includes(track)) {  // Avoid duplicates
                trackUris.push(track);
                if (trackUris.length === 25) break;  // Stop once we have 25 tracks
            }
        }
    }

    // Step 3: Create a new playlist
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
        console.error("Failed to create playlist:", await playlistResponse.text());
        throw new Error("Failed to create playlist.");
    }

    const playlistData = await playlistResponse.json();
    const playlistId = playlistData.id;

    // Step 4: Add the tracks to the playlist
    const addTracksResult = await addTracksToPlaylist(access_token, playlistId, trackUris);

    // Step 5: Return a response to the user
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/html' },
        body: `
            <html>
            <head>
                <title>Our Love Playlist - A Year to Remember</title>
                <style>
                    body {
                        background-color: #fbeae7;
                        font-family: 'Arial', sans-serif;
                        color: #333;
                        text-align: center;
                        padding: 50px;
                    }
                    h1 {
                        color: #e63946;
                        font-size: 48px;
                        margin-bottom: 20px;
                    }
                    p {
                        font-size: 20px;
                        line-height: 1.6;
                        color: #555;
                    }
                    a {
                        display: inline-block;
                        background-color: #e63946;
                        color: #fff;
                        text-decoration: none;
                        padding: 10px 20px;
                        font-size: 18px;
                        border-radius: 10px;
                        margin-top: 20px;
                        transition: background-color 0.3s ease;
                    }
                    a:hover {
                        background-color: #c72e3b;
                    }
                    .celebration {
                        font-size: 24px;
                        color: #7b2cbf;
                        margin-top: 40px;
                        font-weight: bold;
                    }
                    .heart {
                        color: #ff6b6b;
                    }
                </style>
            </head>
            <body>
                <h1>Here's to Us!</h1>
                <p>
                    My dearest love, as we celebrate our 1-year anniversary (October 24th, 2024), 
                    I wanted to give you something special. 
                    <strong>Love U</strong> is a playlist made just for you, 
                    filled with the songs you've been vibing to lately.
                </p>
                <p>
                    May these tracks remind you of the memories we've shared 
                    and the moments we will create in the years to come. 
                    I hope this playlist brings a smile to your face like you do to mine every day.
                </p>
                <a href="${playlistData.external_urls.spotify}" target="_blank">Listen to Our Playlist</a>
                <p class="celebration">
                    Here's to 1 year and many more to come! </p>
            </body>
            </html>
        `,
    };
};
