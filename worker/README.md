# groq-proxy — free Groq API key proxy

Keeps `GROQ_API_KEY` off the client. Without this, anyone can open devtools
on the deployed site, grab the key from the JS bundle, and use it themselves.

## Why Cloudflare Workers, not Firebase Functions?

You're on the Firebase **Spark (free)** plan. Cloud Functions need the
**Blaze** plan just to deploy — and even on Blaze, Spark-tier restrictions
around outbound networking mean a Spark-plan function can't reach
`api.groq.com` anyway. Cloudflare Workers' free plan has no such limits:
**100,000 requests/day, no credit card required.** A simple proxy like this
uses almost none of that.

## One-time setup (~5 minutes)

1. Install the CLI:
   ```
   npm install -g wrangler
   ```

2. Log in (opens a browser to create/link a free Cloudflare account):
   ```
   cd worker
   wrangler login
   ```

3. Set your Groq key as a secret (never written to any file):
   ```
   wrangler secret put GROQ_API_KEY
   ```
   Paste your `gsk_...` key from https://console.groq.com when prompted.

4. Open `wrangler.toml` and update `ALLOWED_ORIGINS` with your real Firebase
   Hosting URL (e.g. `https://your-project-id.web.app`) and your local dev
   URL. This stops other sites from riding on your Groq quota.

5. Deploy:
   ```
   wrangler deploy
   ```
   This prints a URL like `https://cookingina-groq-proxy.YOUR-SUBDOMAIN.workers.dev`.

6. Add that URL to your app's `.env`:
   ```
   VITE_GROQ_PROXY_URL=https://cookingina-groq-proxy.YOUR-SUBDOMAIN.workers.dev
   ```

7. Rebuild and redeploy the app (`npm run build && firebase deploy`).

## Updating later

- Changed the worker code? → `wrangler deploy` again.
- Rotated your Groq key? → `wrangler secret put GROQ_API_KEY` again.
- Added a custom domain? → add it to `ALLOWED_ORIGINS` and redeploy.

## What it protects against

- The Groq API key never appears in any file the browser downloads.
- Only three known models can be requested (no open relay to arbitrary
  Groq usage).
- Requests are capped in size and count, and origin-checked against your
  allowlist.

This does **not** add per-user rate limiting — if you want to cap how much
one visitor can generate per hour, that's a good next step, but wasn't part
of the original ask.
