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

  // Step 1: Get the user's top 8 most played tracks of the last 4 weeks
  const topTracksData = await fetchTopTracks(access_token, 'short_term', 8);
  let trackUris = topTracksData.items.map(track => track.uri);  // Extract 8 track URIs

  // Step 2: If less than 25 tracks, fetch random tracks from the user's saved library (liked songs)
  if (trackUris.length < 25) {
      const savedTracks = await fetchSavedTracks(access_token, 50);  // Fetch 50 tracks from the user's library
      const remainingSlots = 25 - trackUris.length;

      // Shuffle saved tracks and add random ones to fill remaining slots
      const shuffledSavedTracks = savedTracks.sort(() => 0.5 - Math.random());
      const randomSavedTracks = shuffledSavedTracks.slice(0, remainingSlots);

      trackUris = trackUris.concat(randomSavedTracks);  // Add random saved tracks to the playlist
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
            name: 'Love U',
            description: generateDynamicDescription(),  // Dynamic description
            public: true
        })
    });

    const playlistData = await playlistResponse.json();
    const playlistId = playlistData.id;

    // Add the tracks to the playlist
    const addTracksResult = await addTracksToPlaylist(access_token, playlistId, trackUris);

    const imagePath = './IMG_0939.jpeg';  // Path to your image in the root folder
    const imageBase64 = encodeImageToBase64(imagePath);

    const uploadImageUrl = `https://api.spotify.com/v1/playlists/${playlistId}/images`;
    const uploadImageResponse = await fetch(uploadImageUrl, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'image/jpeg'
        },
        body: imageBase64
    });

    // Check if the image upload was successful
    if (uploadImageResponse.ok) {
        console.log("Image uploaded successfully!");
    } else {
        console.error("Failed to upload image", uploadImageResponse.status, await uploadImageResponse.text());
    }

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
