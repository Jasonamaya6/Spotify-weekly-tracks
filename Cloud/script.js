document.getElementById("login-btn").addEventListener("click", () => {
  const clientId = '8f38ba76f6054919bbb67be5ccc30187';  // Your Spotify Client ID
  const redirectUri = 'https://heavyrotation.netlify.app/callback';  // Your Redirect URI
  const scope = 'user-top-read playlist-modify-public';  // Required scopes

  // Construct the Spotify authorization URL
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
  window.location.href = authUrl;  // Redirect to Spotify authorization
});
