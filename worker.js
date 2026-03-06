import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event));
});

function buildCSP() {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "font-src fonts.gstatic.com",
    "img-src 'self' cdn.devlab502.net data: blob:",
    "connect-src 'self' https://api.devlab502.net",
  ].join('; ');
}

async function handleRequest(event) {
  try {
    const response = await getAssetFromKV(event);
    const headers = new Headers(response.headers);

    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    headers.set('Content-Security-Policy', buildCSP());

    return new Response(response.body, { status: response.status, headers });
  } catch (e) {
    // SPA fallback — serve index.html for client-side routing
    try {
      const notFoundResponse = await getAssetFromKV(event, {
        mapRequestToAsset: (req) =>
          new Request(`${new URL(req.url).origin}/index.html`, req),
      });
      const headers = new Headers(notFoundResponse.headers);
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('X-Frame-Options', 'DENY');
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      headers.set('Content-Security-Policy', buildCSP());
      return new Response(notFoundResponse.body, { status: 200, headers });
    } catch {
      return new Response('Not Found', { status: 404 });
    }
  }
}
