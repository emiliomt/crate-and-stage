import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
    const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      console.error('Spotify credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Spotify API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Spotify access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Spotify token error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to authenticate with Spotify' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { access_token } = await tokenResponse.json();

    // Get Spotify's "Top 50 Global" playlist
    const playlistId = '37i9dQZEVXbMDoHDwVN2tF'; // Global Top 50 playlist
    
    const playlistResponse = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );

    if (!playlistResponse.ok) {
      const error = await playlistResponse.text();
      console.error('Spotify playlist error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch playlist' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const playlistData = await playlistResponse.json();

    // Extract unique albums from the playlist tracks
    const albumsMap = new Map();
    
    for (const item of playlistData.items) {
      if (item.track && item.track.album) {
        const album = item.track.album;
        // Only include full albums, not singles
        if ((album.album_type === 'album' || album.album_type === 'compilation') && !albumsMap.has(album.id)) {
          albumsMap.set(album.id, {
            id: album.id,
            name: album.name,
            artist: album.artists[0]?.name || 'Unknown',
            image: album.images[0]?.url || '',
            releaseDate: album.release_date,
            type: 'album',
          });
        }
      }
    }

    // Convert to array and limit to 20 albums
    const albums = Array.from(albumsMap.values()).slice(0, 20);

    // If we don't have enough albums from the playlist, fetch new releases
    if (albums.length < 20) {
      const newReleasesResponse = await fetch(
        `https://api.spotify.com/v1/browse/new-releases?limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${access_token}`,
          },
        }
      );

      if (newReleasesResponse.ok) {
        const newReleasesData = await newReleasesResponse.json();
        
        for (const album of newReleasesData.albums.items) {
          if ((album.album_type === 'album' || album.album_type === 'compilation') && !albumsMap.has(album.id) && albums.length < 20) {
            albums.push({
              id: album.id,
              name: album.name,
              artist: album.artists[0]?.name || 'Unknown',
              image: album.images[0]?.url || '',
              releaseDate: album.release_date,
              type: 'album',
            });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ albums }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in spotify-top-albums function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
