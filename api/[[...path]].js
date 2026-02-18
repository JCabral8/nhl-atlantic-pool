/**
 * Vercel serverless catch-all: forwards all /api/* requests to the Express app.
 * Request path is preserved (e.g. /api/users, /api/standings).
 * Returns a Promise so the runtime waits for the response before freezing.
 */
export default async function handler(req, res) {
  // Vercel passes the path after /api to the catch-all handler
  // e.g., /api/admin/auth -> req.url is /admin/auth
  // We need to restore the /api prefix for Express routes
  const raw = req.url || '/';
  let path = raw.startsWith('/') ? raw : '/' + raw;
  
  // If path doesn't start with /api, add it (Vercel strips /api prefix)
  if (!path.startsWith('/api')) {
    path = '/api' + path;
  }
  
  // Preserve query string if present
  const query = req.url?.includes('?') ? req.url.split('?')[1] : '';
  if (query) {
    path += '?' + query;
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
