const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GENIUS_BASE_URL = 'https://api.genius.com';
// Note: This uses a demo token - users should add their own Genius API token for production
const GENIUS_ACCESS_TOKEN = Deno.env.get('GENIUS_API_TOKEN') || 'demo';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, query, songId } = await req.json();

    let url = '';
    
    switch (action) {
      case 'search':
        url = `${GENIUS_BASE_URL}/search?q=${encodeURIComponent(query)}`;
        break;
      case 'getSong':
        url = `${GENIUS_BASE_URL}/songs/${songId}`;
        break;
      default:
        throw new Error('Invalid action');
    }

    console.log('Fetching from Genius:', url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${GENIUS_ACCESS_TOKEN}`,
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: 'Song not found', response: { song: null } }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      throw new Error(`Genius API error: ${response.statusText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in genius-lyrics:', error);
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
