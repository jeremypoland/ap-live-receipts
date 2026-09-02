/**
 * /api/vision — Anthropic API proxy
 *
 * Plain Vercel serverless function (Node.js, CommonJS).
 * Manually buffers the raw request body to handle large image payloads
 * that exceed Vercel's default 4.5MB body parser limit.
 *
 * Environment variable required (set in Vercel dashboard):
 *   ANTHROPIC_API_KEY
 */

module.exports = async function handler(req, res) {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set');
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  // Manually buffer raw body — bypasses Vercel's 4.5MB default limit
  // Receipt images can be up to ~8MB as base64
  let body;
  try {
    body = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      req.on('error', reject);
    });
  } catch (err) {
    console.error('Body read error:', err);
    return res.status(400).json({ error: 'Failed to read request body' });
  }

  // Parse JSON
  let payload;
  try {
    payload = JSON.parse(body);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  // Forward to Anthropic
  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    const data = await upstream.json();

    // Pass status through so the frontend retry/fallback logic works
    return res.status(upstream.status).json(data);

  } catch (err) {
    console.error('Upstream fetch error:', err);
    return res.status(502).json({ error: 'Proxy request failed', detail: err.message });
  }
};
