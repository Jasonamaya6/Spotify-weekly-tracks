// netlify/functions/spotify-login.js
const querystring = require('querystring');

exports.handler = async function(event, context) {
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const redirect_uri = 'https://heavyrotationspotify.netlify.app/.netlify/functions/callback';
  const scope = 'user-top-read playlist-modify-public';

  // Construct the Spotify authorization URL
  const authUrl = `https://accounts.spotify.com/authorize?${querystring.stringify({
    client_id: client_id,
    response_type: 'code',
    redirect_uri: redirect_uri,
    scope: scope
  })}`;

  // Redirect the user to Spotify login page
  return {
    statusCode: 302,
    headers: {
      Location: authUrl,
    },
  };
};
