import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
const assetManifest = JSON.parse(manifestJSON);

// ── Image upload config ──────────────────────────────────────
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const EXT_MAP = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp' };
const CDN_BASE = 'https://cdn.devlab502.net';
const ALLOWED_ORIGIN = 'https://feedback.devlab502.net';

// ── Admin auth: Cloudflare Access (Zero Trust) ───────────────
// Access gates /admin and /api/admin/* at the edge before this Worker runs;
// the JWT check below is defense in depth. The PostgREST admin token
// (env.ADMIN_JWT, role feedback_admin) never leaves the Worker.
const POSTGREST_BASE = 'https://api.devlab502.net';
const ACCESS_TEAM_DOMAIN = 'devlab502.cloudflareaccess.com';
const ACCESS_JWKS_URL = `https://${ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`;
const ACCESS_AUD = '000e16ca00548e99efa4b709bc67840d1b1707a3888f5c26584062dc669b7017';
const ADMIN_EMAIL = 'sandersd@gmail.com';

// ── Security headers ─────────────────────────────────────────
function buildCSP() {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://analytics.devlab502.net",
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "font-src fonts.gstatic.com",
    "img-src 'self' cdn.devlab502.net data: blob:",
    "connect-src 'self' https://api.devlab502.net https://analytics.devlab502.net https://*.ingest.us.sentry.io",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; ');
}

function addSecurityHeaders(headers) {
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
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

// ── Admin proxy (/api/admin/* → PostgREST with server-held JWT) ──
let cachedJwks = null;

async function getJwks() {
  if (cachedJwks) return cachedJwks;
  const res = await fetch(ACCESS_JWKS_URL, { cf: { cacheTtl: 3600, cacheEverything: true } });
  cachedJwks = await res.json();
  return cachedJwks;
}

function b64url(str) {
  const s = str.replace(/-/g, '+').replace(/_/g, '/');
  return atob(s + '='.repeat((4 - s.length % 4) % 4));
}

async function verifyAccessJwt(token) {
  try {
    const [hdr, pay, sig] = token.split('.');
    if (!sig) return null;
    const header = JSON.parse(b64url(hdr));
    const payload = JSON.parse(b64url(pay));

    if (!payload.exp || Math.floor(Date.now() / 1000) > payload.exp) return null;
    if (payload.iss !== `https://${ACCESS_TEAM_DOMAIN}`) return null;
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(ACCESS_AUD)) return null;

    const jwk = (await getJwks()).keys.find(k => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey(
      'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']
    );
    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5', key,
      Uint8Array.from(b64url(sig), c => c.charCodeAt(0)),
      new TextEncoder().encode(hdr + '.' + pay)
    );
    return valid ? payload : null;
  } catch {
    return null;
  }
}

function adminJson(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

async function handleAdminProxy(request, url, env) {
  const payload = await verifyAccessJwt(request.headers.get('Cf-Access-Jwt-Assertion') || '');
  if (!payload) return adminJson({ message: 'Unauthorized' }, 401);
  if (payload.email !== ADMIN_EMAIL) return adminJson({ message: 'Forbidden' }, 403);

  if (url.pathname === '/api/admin/whoami') return adminJson({ email: payload.email }, 200);

  const fwdHeaders = new Headers({
    'Authorization': `Bearer ${env.ADMIN_JWT}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  });
  const prefer = request.headers.get('Prefer');
  if (prefer) fwdHeaders.set('Prefer', prefer);

  const pgRes = await fetch(POSTGREST_BASE + url.pathname.replace(/^\/api\/admin/, '') + url.search, {
    method: request.method,
    headers: fwdHeaders,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
  });

  return new Response(pgRes.body, {
    status: pgRes.status,
    headers: {
      'Content-Type': pgRes.headers.get('Content-Type') || 'application/json',
      'Cache-Control': 'no-store',
    },
  });
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

    // Route: /api/admin/* → PostgREST as feedback_admin (Cloudflare Access required)
    if (url.pathname.startsWith('/api/admin/')) {
      return handleAdminProxy(request, url, env);
    }

    // Route: /api/upload → image upload to R2
    if (url.pathname === '/api/upload') {
      return handleUpload(request, env);
    }

    // Everything else → static assets (SPA)
    return handleStaticAsset(request, env, ctx);
  },
};
