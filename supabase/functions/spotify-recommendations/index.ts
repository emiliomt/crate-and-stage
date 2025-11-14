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

    // Get new releases (popular albums)
    const releasesResponse = await fetch(
      'https://api.spotify.com/v1/browse/new-releases?limit=12',
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );

    if (!releasesResponse.ok) {
      const error = await releasesResponse.text();
      console.error('Spotify releases error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch recommendations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await releasesResponse.json();

    // Format the results
    const albums = data.albums.items.map((item: any) => ({
      id: item.id,
      name: item.name,
      artist: item.artists[0]?.name,
      image: item.images[0]?.url,
      releaseDate: item.release_date,
      type: 'album',
    }));

    return new Response(
      JSON.stringify({ albums }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in spotify-recommendations function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
