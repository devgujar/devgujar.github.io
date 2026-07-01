/**
 * Cloudflare Worker — Groq chat proxy for the portfolio chatbot.
 *
 * Purpose:
 *   Keeps your GROQ_API_KEY server-side (never exposed to the browser) and
 *   adds the CORS headers GitHub Pages needs to call it cross-origin.
 *
 * The browser widget POSTs: { messages: [...], model: "..." }
 * This Worker forwards it to Groq with the secret key and returns Groq's JSON.
 *
 * Deploy:
 *   1. npm i -g wrangler          (if not already installed)
 *   2. wrangler login
 *   3. wrangler secret put GROQ_API_KEY     (paste your Groq key when prompted)
 *   4. wrangler deploy
 *
 * Then set in index.html:
 *   window.GROQ_PROXY_URL = "https://<your-worker-subdomain>.workers.dev/api/chat";
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

// Lock this down to your site(s). Use "*" only while testing.
const ALLOWED_ORIGINS = [
  "https://devgujar.github.io",
];

// Returns true for any local-development origin (any localhost/127.0.0.1 port)
// and for file:// pages (which send an Origin of "null").
function isLocalOrigin(origin) {
  if (!origin || origin === "null") return true; // file:// double-click
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

function corsHeaders(origin) {
  // Echo the request origin back if it's allowed (explicit list or local dev),
  // otherwise fall back to the primary site origin.
  const allow =
    ALLOWED_ORIGINS.includes(origin) || isLocalOrigin(origin)
      ? (origin && origin !== "null" ? origin : "*")
      : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(body, status, origin, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
      ...extraHeaders,
    },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);

    // 1. CORS preflight — must return the headers with no body.
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // 2. Only accept POST to /api/chat (adjust path if you prefer).
    if (request.method !== "POST" || url.pathname !== "/api/chat") {
      return json({ error: "Not found" }, 404, origin);
    }

    // 3. Ensure the key is configured as a secret.
    if (!env.GROQ_API_KEY) {
      return json({ error: "Server missing GROQ_API_KEY secret" }, 500, origin);
    }

    // 4. Parse and validate the incoming payload.
    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400, origin);
    }

    const messages = Array.isArray(payload.messages) ? payload.messages : null;
    if (!messages) {
      return json({ error: "`messages` array is required" }, 400, origin);
    }

    // 5. Forward to Groq with the secret key.
    try {
      const groqRes = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + env.GROQ_API_KEY,
        },
        body: JSON.stringify({
          model: payload.model || DEFAULT_MODEL,
          messages,
          temperature: 0.3,
          max_tokens: 700,
        }),
      });

      const data = await groqRes.text(); // pass through as-is
      return new Response(data, {
        status: groqRes.status,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(origin),
        },
      });
    } catch (err) {
      return json({ error: "Upstream error: " + err.message }, 502, origin);
    }
  },
};

