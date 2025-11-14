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
    const { albumId } = await req.json();

    if (!albumId) {
      return new Response(
        JSON.stringify({ error: 'Album ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Fetch album details
    const albumResponse = await fetch(
      `https://api.spotify.com/v1/albums/${albumId}`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );

    if (!albumResponse.ok) {
      const error = await albumResponse.text();
      console.error('Spotify album error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch album details' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const albumData = await albumResponse.json();

    // Format the response
    const formattedAlbum = {
      id: albumData.id,
      name: albumData.name,
      artist: albumData.artists[0]?.name || 'Unknown Artist',
      artists: albumData.artists,
      image: albumData.images[0]?.url || '',
      releaseDate: albumData.release_date,
      totalTracks: albumData.total_tracks,
      duration: albumData.tracks.items.reduce((acc: number, track: any) => acc + track.duration_ms, 0),
      label: albumData.label,
      type: albumData.album_type,
      spotifyUrl: albumData.external_urls.spotify,
      popularity: albumData.popularity,
      genres: albumData.genres || [],
      copyrights: albumData.copyrights || [],
      availableMarkets: albumData.available_markets?.length || 0,
      tracks: albumData.tracks.items.map((track: any) => ({
        id: track.id,
        name: track.name,
        duration_ms: track.duration_ms,
        track_number: track.track_number,
        artists: track.artists.map((artist: any) => artist.name),
        explicit: track.explicit,
      })),
    };

    return new Response(
      JSON.stringify(formattedAlbum),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in spotify-album-details function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
