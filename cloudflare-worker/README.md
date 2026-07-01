# Groq Chat Proxy (Cloudflare Worker)

Keeps your **Groq API key server-side** so the portfolio chatbot works for every
visitor **without asking them for a key**. Also adds the **CORS headers** GitHub
Pages needs to call it.

## Files
- `groq-proxy.js` — the Worker source (handles CORS + forwards to Groq).
- `wrangler.toml` — deploy config.

## One-time deploy

```powershell
# 1. Install Wrangler (Cloudflare CLI) if you don't have it
npm install -g wrangler

# 2. Log in to your Cloudflare account
wrangler login

# 3. From THIS folder, store your Groq key as an encrypted secret
cd cloudflare-worker
wrangler secret put GROQ_API_KEY
#   -> paste your key from https://console.groq.com/keys  and press Enter

# 4. Deploy
wrangler deploy
```

Wrangler prints the deployed URL, e.g.:
```
https://groq-proxy.<your-subdomain>.workers.dev
```

Your chat endpoint is that URL + `/api/chat`.

## Wire it into the site

In `index.html`, set the proxy URL (in the runtime-config `<script>`):

```js
window.GROQ_PROXY_URL = "https://groq-proxy.<your-subdomain>.workers.dev/api/chat";
```

That's it — the widget will now call your Worker, the 🔑 key prompt disappears,
and visitors can chat with no key of their own.

## Lock down origins (recommended)

In `groq-proxy.js`, edit `ALLOWED_ORIGINS` to only your site(s):

```js
const ALLOWED_ORIGINS = [
  "https://devgujar.github.io",
  "http://localhost:8080",   // for local testing
];
```

Redeploy after changes with `wrangler deploy`.

