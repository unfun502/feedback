import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
const assetManifest = JSON.parse(manifestJSON);

// ── Image upload config ──────────────────────────────────────
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const EXT_MAP = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp' };
const CDN_BASE = 'https://cdn.devlab502.net';
const ALLOWED_ORIGIN = 'https://feedback.devlab502.net';

// ── Security headers ─────────────────────────────────────────
function buildCSP() {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://analytics.devlab502.net",
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "font-src fonts.gstatic.com",
    "img-src 'self' cdn.devlab502.net data: blob:",
    "connect-src 'self' https://api.devlab502.net https://analytics.devlab502.net https://*.ingest.us.sentry.io",
  ].join('; ');
}

function addSecurityHeaders(headers) {
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  headers.set('Content-Security-Policy', buildCSP());
}

// ── CORS helpers for upload endpoint ─────────────────────────
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

// ── Image upload handler ─────────────────────────────────────
async function handleUpload(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ message: 'Method not allowed' }, 405);
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return jsonResponse({ message: 'No file provided' }, 400);
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return jsonResponse({ message: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' }, 400);
    }

    if (file.size > MAX_SIZE) {
      return jsonResponse({ message: 'File too large. Maximum 5MB.' }, 400);
    }

    const ext = EXT_MAP[file.type] || 'bin';
    const key = `images/${crypto.randomUUID()}.${ext}`;

    await env.UPLOADS.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
    });

    return jsonResponse({ url: `${CDN_BASE}/${key}` });
  } catch (err) {
    return jsonResponse({ message: 'Upload failed' }, 500);
  }
}

// ── Static asset serving ─────────────────────────────────────
async function handleStaticAsset(request, env, ctx) {
  const event = { request, waitUntil: ctx.waitUntil.bind(ctx) };
  const options = {
    ASSET_NAMESPACE: env.__STATIC_CONTENT,
    ASSET_MANIFEST: assetManifest,
  };

  try {
    const response = await getAssetFromKV(event, options);
    const headers = new Headers(response.headers);
    addSecurityHeaders(headers);
    return injectAnalytics(new Response(response.body, { status: response.status, headers }), env);
  } catch {
    // SPA fallback — serve index.html for client-side routing
    try {
      const fallbackEvent = {
        request: new Request(`${new URL(request.url).origin}/index.html`, request),
        waitUntil: ctx.waitUntil.bind(ctx),
      };
      const notFoundResponse = await getAssetFromKV(fallbackEvent, options);
      const headers = new Headers(notFoundResponse.headers);
      addSecurityHeaders(headers);
      return injectAnalytics(new Response(notFoundResponse.body, { status: 200, headers }), env);
    } catch {
      return new Response('Not Found', { status: 404 });
    }
  }
}

// ── Analytics injection ──────────────────────────────────────
function injectAnalytics(response, env) {
  const ct = response.headers.get('content-type') || ''
  if (ct.includes('text/html') && env.UMAMI_SITE_ID) {
    return new HTMLRewriter()
      .on('head', {
        element(el) {
          el.append(`<script defer src="https://analytics.devlab502.net/script.js" data-website-id="${env.UMAMI_SITE_ID}"></script>`, { html: true })
        }
      })
      .transform(response)
  }
  return response
}

// ── Main handler ─────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Route: /api/upload → image upload to R2
    if (url.pathname === '/api/upload') {
      return handleUpload(request, env);
    }

    // Everything else → static assets (SPA)
    return handleStaticAsset(request, env, ctx);
  },
};
