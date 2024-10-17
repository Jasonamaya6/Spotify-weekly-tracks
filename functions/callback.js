const fs = require('fs');
const querystring = require('querystring');
const fetch = require('node-fetch');

// Function to read and convert the image to base64
function encodeImageToBase64(imagePath) {
    const image = fs.readFileSync(imagePath);
    return image.toString('base64');  // Convert to base64
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
            description: 'Weekly curated playlist',
            public: true
        })
    });

    const playlistData = await playlistResponse.json();
    const playlistId = playlistData.id;

    // Read the image from the file system and encode it to base64
    const imagePath = './IMG_0939.jpeg';  // Path to your image
    const imageBase64 = encodeImageToBase64(imagePath);

    // Upload the image to Spotify (as base64 without the "data:image/jpeg;base64," part)
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

    // Return a response to the user
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
