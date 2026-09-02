/**
 * /api/vision — Anthropic API proxy
 *
 * Forwards vision requests from the frontend to Anthropic,
 * injecting the API key from the ANTHROPIC_API_KEY environment variable.
 *
 * The frontend sends the full Anthropic messages payload (model, max_tokens,
 * messages array with base64 image + prompt). This function adds auth headers
 * and forwards it, then streams the response back.
 *
 * Environment variables required (set in Vercel dashboard):
 *   ANTHROPIC_API_KEY — your Anthropic secret key
 */

export const config = {
  // Increase body size limit — receipt images can be large
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY environment variable is not set');
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-api-key':       apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    const data = await upstream.json();

    // Pass through status code so the frontend's retry/fallback logic works
    return res.status(upstream.status).json(data);

  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(502).json({ error: 'Proxy request failed', detail: err.message });
  }
}
