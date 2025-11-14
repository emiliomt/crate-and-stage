const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GENIUS_BASE_URL = 'https://api.genius.com';
// Get Genius API token from environment variables
// Users need to add GENIUS_API_TOKEN secret with their token from https://genius.com/api-clients
const GENIUS_ACCESS_TOKEN = Deno.env.get('GENIUS_API_TOKEN');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if API token is configured
    if (!GENIUS_ACCESS_TOKEN) {
      return new Response(
        JSON.stringify({ 
          error: 'Lyrics service not configured. Please add GENIUS_API_TOKEN to use this feature.',
          response: { hits: [] }
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

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
          JSON.stringify({ error: 'Song not found', response: { hits: [] } }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      if (response.status === 401) {
        console.error('Genius API unauthorized - Invalid or missing API token');
        return new Response(
          JSON.stringify({ 
            error: 'Lyrics service requires valid API token. Please configure GENIUS_API_TOKEN.',
            response: { hits: [] }
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      console.error(`Genius API error: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({ 
          error: 'Unable to fetch lyrics',
          response: { hits: [] }
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in genius-lyrics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: 'Lyrics service temporarily unavailable',
        response: { hits: [] }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
