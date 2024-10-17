const querystring = require('querystring');
const fetch = require('node-fetch');

// Function to generate dynamic description
function generateDynamicDescription() {
    const descriptions = [
        "This week lets reflect on why we began",
        "Love... The most unexplanable feeling ",
        "GET UP AND GET TO WORK THIS WEEK IS GOING TO BE AWESOME!",
        "ANOTHER WEEK ANOTHER DOLLA if you feel tired just dont and get your duties done",
        "Remeber I love you very much always reflect back on yorusslef and tell youself your awesome"
    ];

    // Randomly pick a description from the list
    const randomIndex = Math.floor(Math.random() * descriptions.length);
    return descriptions[randomIndex];
}

// Function to fetch top tracks for a specific time range
async function fetchTopTracks(access_token, time_range, limit) {
    const topTracksUrl = `https://api.spotify.com/v1/me/top/tracks?time_range=${time_range}&limit=${limit}`;
    const response = await fetch(topTracksUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${access_token}` }
    });

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
    return addTracksResponse.json();
}

exports.handler = async function(event, context) {
    const client_id = process.env.SPOTIFY_CLIENT_ID;
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirect_uri = 'https://heavyrotationspotify.netlify.app/.netlify/functions/callback';
    
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

    const tokenData = await response.json();
    const access_token = tokenData.access_token;

    // Try to get the user's most played tracks of the week (time_range = 'short_term' for the last 4 weeks)
    const topTracksData = await fetchTopTracks(access_token, 'short_term', 25);
    let trackUris = topTracksData.items.map(track => track.uri);  // Extract track URIs

    // If less than 25 tracks, try to get the most played tracks of the year (time_range = 'long_term')
    if (trackUris.length < 25) {
        const topYearTracksData = await fetchTopTracks(access_token, 'long_term', 25 - trackUris.length);
        trackUris = trackUris.concat(topYearTracksData.items.map(track => track.uri));  // Add URIs to the list
    }

    // If still not enough tracks, add from a Top 100 list (this is hardcoded or could come from an external source)
    if (trackUris.length < 25) {
        const top100Tracks = [
            // Add Spotify track URIs here for the top 100 songs (example URIs)
            "spotify:track:4uLU6hMCjMI75M1A2tKUQC", // Example track 1
            "spotify:track:2TpxZ7JUBn3uw46aR7qd6V", // Example track 2
            "spotify:track:6rqhFgbbKwnb9MLmUQDhG6", // Example track 3
            // Add more URIs here as needed...
        ];
        const missingTracksCount = 25 - trackUris.length;
        trackUris = trackUris.concat(top100Tracks.slice(0, missingTracksCount));
    }

    // Create a new playlist
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

    const playlistData = await playlistResponse.json();
    const playlistId = playlistData.id;

    // Add the tracks to the playlist
    const addTracksResult = await addTracksToPlaylist(access_token, playlistId, trackUris);

    // Upload a custom image for the playlist (optional)
    const imageBase64 = "IMG_0939.jpeg";  // Replace this with your image's base64 string
    const uploadImageUrl = `https://api.spotify.com/v1/playlists/${playlistId}/images`;
    await fetch(uploadImageUrl, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'image/jpeg'
        },
        body: imageBase64  // Upload the base64 string of the image
    });

    // Return the playlist URL to the user
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
