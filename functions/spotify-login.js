const querystring = require('querystring');

exports.handler = async function(event, context) {
    const client_id = process.env.SPOTIFY_CLIENT_ID;  // Your Spotify Client ID
    const redirect_uri = 'https://heavyrotationspotify.netlify.app/.netlify/functions/callback';  // Spotify redirect URI
    const scope = 'user-top-read playlist-modify-public';  // Scopes for Spotify API

    // Construct the Spotify authorization URL
    const authUrl = `https://accounts.spotify.com/authorize?${querystring.stringify({
        client_id: client_id,
        response_type: 'code',
        redirect_uri: redirect_uri,
        scope: scope,
    })}`;

    // Redirect the user to Spotify's login page
    return {
        statusCode: 302,
        headers: {
            Location: authUrl,
        },
    };
};
