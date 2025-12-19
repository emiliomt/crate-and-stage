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
    const { accessToken, dataType, timeRange = 'medium_term', limit = 20 } = await req.json();

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Access token required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
    };

    let data;

    switch (dataType) {
      case 'topTracks': {
        console.log(`Fetching top tracks (${timeRange})...`);
        const response = await fetch(
          `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
          { headers }
        );
        
        if (!response.ok) {
          const error = await response.text();
          console.error('Failed to fetch top tracks:', error);
          throw new Error('Failed to fetch top tracks');
        }
        
        const result = await response.json();
        data = {
          tracks: result.items.map((track: any) => ({
            id: track.id,
            name: track.name,
            artist: track.artists[0]?.name,
            artistId: track.artists[0]?.id,
            album: track.album.name,
            albumId: track.album.id,
            image: track.album.images[0]?.url,
            previewUrl: track.preview_url,
            popularity: track.popularity,
          })),
        };
        break;
      }

      case 'topArtists': {
        console.log(`Fetching top artists (${timeRange})...`);
        const response = await fetch(
          `https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=${limit}`,
          { headers }
        );
        
        if (!response.ok) {
          const error = await response.text();
          console.error('Failed to fetch top artists:', error);
          throw new Error('Failed to fetch top artists');
        }
        
        const result = await response.json();
        data = {
          artists: result.items.map((artist: any) => ({
            id: artist.id,
            name: artist.name,
            image: artist.images[0]?.url,
            genres: artist.genres,
            popularity: artist.popularity,
            followers: artist.followers.total,
          })),
        };
        break;
      }

      case 'recentlyPlayed': {
        console.log('Fetching recently played...');
        const response = await fetch(
          `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`,
          { headers }
        );
        
        if (!response.ok) {
          const error = await response.text();
          console.error('Failed to fetch recently played:', error);
          throw new Error('Failed to fetch recently played');
        }
        
        const result = await response.json();
        data = {
          tracks: result.items.map((item: any) => ({
            id: item.track.id,
            name: item.track.name,
            artist: item.track.artists[0]?.name,
            artistId: item.track.artists[0]?.id,
            album: item.track.album.name,
            albumId: item.track.album.id,
            image: item.track.album.images[0]?.url,
            playedAt: item.played_at,
          })),
        };
        break;
      }

      case 'savedAlbums': {
        console.log('Fetching saved albums...');
        const response = await fetch(
          `https://api.spotify.com/v1/me/albums?limit=${limit}`,
          { headers }
        );
        
        if (!response.ok) {
          const error = await response.text();
          console.error('Failed to fetch saved albums:', error);
          throw new Error('Failed to fetch saved albums');
        }
        
        const result = await response.json();
        data = {
          albums: result.items.map((item: any) => ({
            id: item.album.id,
            name: item.album.name,
            artist: item.album.artists[0]?.name,
            artistId: item.album.artists[0]?.id,
            image: item.album.images[0]?.url,
            releaseDate: item.album.release_date,
            addedAt: item.added_at,
          })),
        };
        break;
      }

      case 'followedArtists': {
        console.log('Fetching followed artists...');
        const response = await fetch(
          `https://api.spotify.com/v1/me/following?type=artist&limit=${limit}`,
          { headers }
        );
        
        if (!response.ok) {
          const error = await response.text();
          console.error('Failed to fetch followed artists:', error);
          throw new Error('Failed to fetch followed artists');
        }
        
        const result = await response.json();
        data = {
          artists: result.artists.items.map((artist: any) => ({
            id: artist.id,
            name: artist.name,
            image: artist.images[0]?.url,
            genres: artist.genres,
            followers: artist.followers.total,
          })),
        };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid data type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in spotify-user-data function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
