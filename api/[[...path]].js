/**
 * Vercel serverless catch-all: forwards all /api/* requests to the Express app.
 * Request path is preserved (e.g. /api/users, /api/standings).
 * Returns a Promise so the runtime waits for the response before freezing.
 *
 * This handler assumes Vercel passes req.url as either:
 *   - "/api/xxx"  (full API path), or
 *   - "xxx" or "/xxx" (path after /api)
 * We normalize to always start with "/api" before handing off to Express.
 */
export default async function handler(req, res) {
  // Ensure Express sees a clean path-only URL
  const raw = req.url || req.originalUrl || '/';
  let path = raw;

  // If Vercel ever gives a full URL, strip to pathname+search
  if (!path.startsWith('/')) {
    try {
      const u = new URL(raw);
      path = u.pathname + (u.search || '');
    } catch {
      path = raw;
    }
  }

  // Ensure path starts with /api for Express routes
  if (path.startsWith('/api/')) {
    // already correct
  } else if (path === '/api') {
    // root API path
  } else if (path.startsWith('/')) {
    // e.g. "/users" -> "/api/users"
    path = '/api' + path;
  } else {
    // e.g. "users" -> "/api/users"
    path = '/api/' + path;
  }

  req.url = path;
  req.originalUrl = path;

  const { default: app } = await import('../backend/src/app.js');
  return new Promise((resolve, reject) => {
    res.on('finish', () => resolve());
    res.on('error', reject);
    app(req, res);
  });
}
