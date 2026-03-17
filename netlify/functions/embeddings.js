// netlify/functions/embeddings.js
// Proxy sécurisé pour générer des embeddings via OpenAI text-embedding-3-small

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export const handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders() };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: 'OPENAI_API_KEY non configurée.' } }),
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    };
  }

  const token = (event.headers.authorization || event.headers.Authorization)?.replace("Bearer ", "");
  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: { message: 'Unauthorized: Missing Supabase token.' } }),
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { input } = body;

    if (!input || typeof input !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: { message: 'Missing or invalid required field: input.' } }),
        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
      };
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
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: { message: `OpenAI API Error: ${errorData.error?.message || response.statusText}` } }),
        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ embedding: data.data[0].embedding }),
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: err.message } }),
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    };
  }
};
