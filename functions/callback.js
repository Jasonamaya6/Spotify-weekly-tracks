const querystring = require('querystring');
const fetch = require('node-fetch');

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

    // Use the access token to fetch the user's top tracks
    const topTracksUrl = 'https://api.spotify.com/v1/me/top/tracks?limit=25';
    const topTracksResponse = await fetch(topTracksUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${access_token}` }
    });

    const topTracksData = await topTracksResponse.json();
    const trackUris = topTracksData.items.map(track => track.uri);  // Extract track URIs

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
            description: 'My personalized top tracks',
            public: true
        })
    });

    const playlistData = await playlistResponse.json();
    const playlistId = playlistData.id;

    // Add the tracks to the newly created playlist
    const addTracksUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    const addTracksResponse = await fetch(addTracksUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uris: trackUris })
    });

    const addTracksResult = await addTracksResponse.json();

    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Playlist created and tracks added!', playlistData, addTracksResult }),
    };
};
