export default {
  async fetch(request) {
    // Handle CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Route: POST /_v1/obfuscate
    if (url.pathname === '/_v1/obfuscate' && request.method === 'POST') {
      try {
        const body = await request.json();
        const script = body?.script;

        if (!script || typeof script !== 'string') {
          return new Response(
            JSON.stringify({ ok: false, error: 'missing script string' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Forward to WeAreDevs
        const res = await fetch('https://wearedevs.net/api/obfuscate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ script }),
        });

        const text = await res.text();
        const HEADER_RE = /--\[\[\s*v1\.0\.0\s*https:\/\/wearedevs\.net\/obfuscator\s*\]\]\s*/i;
        const cleaned = text.replace(HEADER_RE, '');
        
        let obfuscated;
        try {
          const parsed = JSON.parse(cleaned);
          obfuscated = parsed.obfuscated || parsed.result || parsed;
        } catch {
          obfuscated = cleaned;
        }

        return new Response(
          JSON.stringify({ ok: true, obfuscated }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ ok: false, error: String(err) }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Default 404
    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};
