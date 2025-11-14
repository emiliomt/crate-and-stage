const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AUDIODB_BASE_URL = 'https://www.theaudiodb.com/api/v1/json/2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, query, artistId, albumId } = await req.json();

    let url = '';
    
    switch (action) {
      case 'searchArtist':
        url = `${AUDIODB_BASE_URL}/search.php?s=${encodeURIComponent(query)}`;
        break;
      case 'getAlbumsByArtist':
        url = `${AUDIODB_BASE_URL}/album.php?i=${artistId}`;
        break;
      case 'getTracksByAlbum':
        url = `${AUDIODB_BASE_URL}/track.php?m=${albumId}`;
        break;
      case 'searchAlbum':
        const { artist, album } = JSON.parse(query);
        url = `${AUDIODB_BASE_URL}/searchalbum.php?s=${encodeURIComponent(artist)}&a=${encodeURIComponent(album)}`;
        break;
      default:
        throw new Error('Invalid action');
    }

    console.log('Fetching from AudioDB:', url);

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`AudioDB API error: ${response.statusText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in audiodb-search:', error);
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
