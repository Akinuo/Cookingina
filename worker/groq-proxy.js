/**
 * groq-proxy — Cloudflare Worker
 * ─────────────────────────────────────────────────────────────────
 * Keeps the Groq API key server-side. The React app never sees it —
 * it only knows this Worker's URL.
 *
 * Why not Firebase Cloud Functions? Cloud Functions require the
 * Blaze (pay-as-you-go) plan to deploy at all, and the Spark (free)
 * plan blocks outbound requests to non-Google hosts anyway — so it
 * couldn't reach api.groq.com even if deployed. Cloudflare Workers'
 * free plan (100,000 requests/day, no credit card) has neither
 * restriction, so it's the free option that actually works here.
 *
 * Deploy:
 *   1. npm install -g wrangler          (one-time)
 *   2. cd worker && wrangler login
 *   3. wrangler secret put GROQ_API_KEY   → paste your gsk_... key
 *   4. wrangler deploy
 *   5. Copy the printed *.workers.dev URL into your app's .env as
 *      VITE_GROQ_PROXY_URL
 *
 * See worker/README.md for the full walkthrough.
 */

// Only these three models may be requested — stops the proxy being
// used as an open relay to burn your Groq quota on other models.
const ALLOWED_MODELS = new Set([
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'llama-guard-3-8b',
])

const MAX_MESSAGES     = 20      // cap conversation size sent per request
const MAX_MESSAGE_LEN  = 8000    // cap chars per message
const MAX_TOKENS_LIMIT = 4000    // hard ceiling regardless of what client asks for

function corsHeaders(origin, allowedOrigins) {
  const allow = allowedOrigins.includes('*') || allowedOrigins.some(o => matchOrigin(o, origin))
    ? (origin || '*')
    : allowedOrigins[0] || ''
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  }
}

// Supports exact matches and simple "*.example.com" wildcard patterns.
function matchOrigin(pattern, origin) {
  if (!origin) return false
  if (pattern === origin) return true
  if (pattern.startsWith('*.')) {
    const suffix = pattern.slice(1) // ".example.com"
    return origin.endsWith(suffix)
  }
  return false
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || ''
    const allowedOrigins = (env.ALLOWED_ORIGINS || '')
      .split(',').map(s => s.trim()).filter(Boolean)
    const cors = corsHeaders(origin, allowedOrigins)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, cors)
    }

    // Reject requests from origins not on the allowlist (defence in depth —
    // browsers already enforce CORS, but non-browser clients ignore it).
    if (allowedOrigins.length && !allowedOrigins.includes('*') &&
        !allowedOrigins.some(o => matchOrigin(o, origin))) {
      return json({ error: 'Origin not allowed' }, 403, cors)
    }

    if (!env.GROQ_API_KEY) {
      return json({ error: 'Server misconfigured: GROQ_API_KEY not set' }, 500, cors)
    }

    let body
    try {
      body = await request.json()
    } catch {
      return json({ error: 'Invalid JSON body' }, 400, cors)
    }

    const { model, messages, max_tokens } = body || {}

    if (!ALLOWED_MODELS.has(model)) {
      return json({ error: `Model not allowed: ${model}` }, 400, cors)
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: 'messages must be a non-empty array' }, 400, cors)
    }
    if (messages.length > MAX_MESSAGES) {
      return json({ error: `Too many messages (max ${MAX_MESSAGES})` }, 400, cors)
    }
    for (const m of messages) {
      if (typeof m?.content !== 'string' || m.content.length > MAX_MESSAGE_LEN) {
        return json({ error: 'Invalid or oversized message content' }, 400, cors)
      }
      if (!['system', 'user', 'assistant'].includes(m?.role)) {
        return json({ error: 'Invalid message role' }, 400, cors)
      }
    }

    const cappedTokens = Math.min(Number(max_tokens) || 1000, MAX_TOKENS_LIMIT)

    let groqRes
    try {
      groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({ model, messages, max_tokens: cappedTokens, temperature: 0.5 }),
      })
    } catch (err) {
      return json({ error: 'Failed to reach Groq: ' + err.message }, 502, cors)
    }

    const data = await groqRes.json().catch(() => ({}))
    return json(data, groqRes.status, cors)
  },
}
