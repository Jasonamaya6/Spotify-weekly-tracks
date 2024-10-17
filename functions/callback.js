const querystring = require('querystring');
const fetch = require('node-fetch');

// Function to generate dynamic description
function generateDynamicDescription() {
    const descriptions = [
        "Your top hits of the week!",
        "Fresh tracks just for you!",
        "These are the songs defining your vibe this week.",
        "Another week, another playlist!",
        "Curated based on your recent listening habits."
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
            const track = item.track.uri;  // Get the track URI
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
            name: 'My Top 25 of the Week',
            description: generateDynamicDescription(),  // Dynamic description
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
            <head><title>Playlist Created</title></head>
            <body>
                <h1>Playlist Created!</h1>
                <p>Your playlist <strong>${playlistData.name}</strong> has been created!</p>
                <p><a href="${playlistData.external_urls.spotify}" target="_blank">Click here to view your playlist on Spotify</a></p>
            </body>
            </html>
        `,
    };
};
