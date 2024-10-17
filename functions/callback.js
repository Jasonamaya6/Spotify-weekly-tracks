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

    // Respond with the access token (for debugging purposes)
    return {
        statusCode: 200,
        body: JSON.stringify(tokenData),
    };
};
