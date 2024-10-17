const querystring = require('querystring');
const fetch = require('node-fetch');

// Function to generate dynamic description
function generateDynamicDescription() {
    const descriptions = [
        "Believe you can baby and you're halfway there..... ",
        "Your time is limited, don't waste it living someone else's life. Beutiful quote that I go by from Steve Jobs",
        "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight. – Proverbs 3:5-6",
        "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go. – Joshua 1:9",
        "If your feeling down this week just know everything will be okay. Take a moment and reflect your journey and what got you to the position you are in rightnow.",
        "Share one strong, positive word with me, and together we’ll hone it and live by it for the week.",
        "Great things never come from comfort zones. Keep pushing forward and break through your limits.",
        "For this week baby, I want you to accomplish a uncomfortable goal. Set it and complete! An individual grows when they step out of their comfort zone",
        "Life is a journey, not a race. Embrace every moment and savor the progress you’re making.",
        "Sllllloooooowwwwwwww downnnnnnnnn.... Life is chilllllll and take a look around and appreciate life for its moments",
        "Open Arms better be in the list for this week",
        "Mhm lol",
        "Text a person and tell them you love them, they'll appreciate it",
        "Set a goal for this week, use music as a motivator and lets get this MONNNNEEEYYYYYY",
        "If she aint hawk tuaing i gonna talk tua.... Sorry needed to add this one for the week lol.",
        "Dont forget to smile this week!!!!!!!!! Love U",
        "Let go of the past, embrace the present, and have faith in the future. You’re right where you need to be.",
        "One day we will have a big house, two dogs, and a twea in our hand !!!! LOL",
        "This week I want you to compliment the people around you theyll appreciate your positivity.",
        "If you see this one I owe you CFA or Chipotle for my big backkkkkkkkk!",
        "SMILEEEEE BECAUSE YOU ARE ABLE BODY",
        "There are no words in the english that explain how perfect you are... so i am just stickign with the word perfect",
        "This is the last quote of them all I hope to forever be with you i cant wait for this journey",
        "Lucky and Stitch love you"
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
