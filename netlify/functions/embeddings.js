// netlify/functions/embeddings.js
// Proxy sécurisé pour générer des embeddings via OpenAI text-embedding-3-small

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export default async (request) => {
  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders()
    });
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) {
    return new Response(
      JSON.stringify({ error: { message: 'OPENAI_API_KEY non configurée.' } }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
    );
  }

  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return new Response(
      JSON.stringify({ error: { message: 'Unauthorized: Missing Supabase token.' } }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
    );
  }

  try {
    const body = await request.json();
    const { input } = body;

    if (!input || typeof input !== 'string') {
      return new Response(
        JSON.stringify({ error: { message: 'Missing or invalid required field: input.' } }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      );
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAiKey}`
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: input,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return new Response(
        JSON.stringify({ error: { message: `OpenAI API Error: ${errorData.error?.message || response.statusText}` } }),
        { status: response.status, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      );
    }

    const data = await response.json();

    // Structure standardisée de retour d'embedding
    return new Response(JSON.stringify({
      embedding: data.data[0].embedding
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders()
      }
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: { message: err.message } }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
    );
  }
};

export const config = {
  path: '/.netlify/functions/embeddings'
};
