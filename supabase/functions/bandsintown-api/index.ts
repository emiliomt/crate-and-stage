const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BANDSINTOWN_BASE_URL = 'https://rest.bandsintown.com';
const APP_ID = 'vinyl_social_music_app';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, artistName, dateRange } = await req.json();

    let url = '';
    
    switch (action) {
      case 'getArtist':
        url = `${BANDSINTOWN_BASE_URL}/artists/${encodeURIComponent(artistName)}?app_id=${APP_ID}`;
        break;
      case 'getEvents':
        url = `${BANDSINTOWN_BASE_URL}/artists/${encodeURIComponent(artistName)}/events?app_id=${APP_ID}`;
        if (dateRange) {
          url += `&date=${dateRange}`;
        }
        break;
      default:
        throw new Error('Invalid action');
    }

    console.log('Fetching from Bandsintown:', url);

    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: 'Artist not found' }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      throw new Error(`Bandsintown API error: ${response.statusText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in bandsintown-api:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
