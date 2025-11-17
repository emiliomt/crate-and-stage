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

    console.log('Fetching Global Top 50 playlist...');
    
    // Fetch Spotify's Global Top 50 playlist
    const playlistId = '37i9dQZEVXbMDoHDwVN2tF';
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
      
      // Fallback to new releases
      console.log('Falling back to new releases...');
      const newReleasesResponse = await fetch(
        `https://api.spotify.com/v1/browse/new-releases?limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${access_token}`,
          },
        }
      );

      if (!newReleasesResponse.ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch albums' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const newReleasesData = await newReleasesResponse.json();
      const albums = newReleasesData.albums.items
        .filter((album: any) => album.album_type === 'album' || album.album_type === 'compilation')
        .slice(0, 20)
        .map((album: any) => ({
          id: album.id,
          name: album.name,
          artist: album.artists[0]?.name || 'Unknown',
          image: album.images[0]?.url || '',
          releaseDate: album.release_date,
          type: 'album',
        }));

      return new Response(
        JSON.stringify({ albums }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const playlistData = await playlistResponse.json();
    console.log(`Found ${playlistData.items.length} tracks in Global Top 50`);

    // Extract albums and count their frequency
    const albumFrequency = new Map<string, { album: any; count: number }>();
    
    for (const item of playlistData.items) {
      if (item.track && item.track.album) {
        const album = item.track.album;
        
        // Only include full albums, not singles
        if (album.album_type === 'album' || album.album_type === 'compilation') {
          if (albumFrequency.has(album.id)) {
            albumFrequency.get(album.id)!.count++;
          } else {
            albumFrequency.set(album.id, { album, count: 1 });
          }
        }
      }
    }

    console.log(`Found ${albumFrequency.size} unique albums`);

    // Fetch full album details for popularity scores
    const albumIds = Array.from(albumFrequency.keys()).slice(0, 50); // Get up to 50 album IDs
    const albumDetailsResponse = await fetch(
      `https://api.spotify.com/v1/albums?ids=${albumIds.join(',')}`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );

    let albumsWithDetails = [];
    
    if (albumDetailsResponse.ok) {
      const albumDetailsData = await albumDetailsResponse.json();
      
      // Combine frequency data with album details
      albumsWithDetails = albumDetailsData.albums
        .filter((album: any) => album !== null)
        .map((album: any) => {
          const frequencyData = albumFrequency.get(album.id);
          return {
            id: album.id,
            name: album.name,
            artist: album.artists[0]?.name || 'Unknown',
            image: album.images[0]?.url || '',
            releaseDate: album.release_date,
            type: 'album',
            frequency: frequencyData?.count || 0,
            popularity: album.popularity || 0,
          };
        })
        // Sort by frequency first (more tracks in top 50 = higher rank), then by popularity
        .sort((a: any, b: any) => {
          if (b.frequency !== a.frequency) {
            return b.frequency - a.frequency;
          }
          return b.popularity - a.popularity;
        })
        .slice(0, 20)
        // Remove frequency and popularity from final output
        .map(({ frequency, popularity, ...album }: any) => album);
      
      console.log(`Returning ${albumsWithDetails.length} top albums`);
    } else {
      // If we can't get details, just use the frequency data
      albumsWithDetails = Array.from(albumFrequency.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 20)
        .map(([id, { album }]) => ({
          id: album.id,
          name: album.name,
          artist: album.artists[0]?.name || 'Unknown',
          image: album.images[0]?.url || '',
          releaseDate: album.release_date,
          type: 'album',
        }));
    }

    return new Response(
      JSON.stringify({ albums: albumsWithDetails }),
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
