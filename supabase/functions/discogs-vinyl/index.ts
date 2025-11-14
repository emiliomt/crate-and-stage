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
    const { artist, album } = await req.json();

    if (!artist || !album) {
      return new Response(
        JSON.stringify({ error: 'Artist and album are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const discogsToken = Deno.env.get('DISCOGS_TOKEN');

    if (!discogsToken) {
      console.error('Discogs token not configured');
      return new Response(
        JSON.stringify({ error: 'Discogs API not configured', results: [] }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search for vinyl releases
    const searchQuery = encodeURIComponent(`${artist} ${album}`);
    const searchUrl = `https://api.discogs.com/database/search?q=${searchQuery}&type=release&format=vinyl&per_page=10`;

    console.log('Searching Discogs for:', artist, album);

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'MusicboardApp/1.0',
        'Authorization': `Discogs token=${discogsToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Discogs API error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch vinyl data', results: [] }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    // Format the results
    const formattedResults = data.results?.slice(0, 5).map((result: any) => ({
      id: result.id,
      title: result.title,
      year: result.year,
      country: result.country,
      format: result.format?.join(', ') || 'Vinyl',
      label: result.label?.join(', ') || 'Unknown Label',
      coverImage: result.cover_image || result.thumb,
      uri: result.uri,
      resourceUrl: result.resource_url,
    })) || [];

    return new Response(
      JSON.stringify({ 
        results: formattedResults,
        totalResults: data.pagination?.items || 0 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in discogs-vinyl function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', results: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
