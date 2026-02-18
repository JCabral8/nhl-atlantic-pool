/**
 * Vercel serverless catch-all: forwards all /api/* requests to the Express app.
 * Request path is preserved (e.g. /api/users, /api/standings).
 * Returns a Promise so the runtime waits for the response before freezing.
 */
export default async function handler(req, res) {
  // Vercel catch-all: /api/* routes here
  // req.url might be full path (/api/admin/auth) or relative (/admin/auth)
  const raw = req.url || req.originalUrl || req.path || '/';
  let path = raw;
  
  // Handle full URLs if present
  if (path.startsWith('http')) {
    try {
      const u = new URL(path);
      path = u.pathname + (u.search || '');
    } catch (_) {
      path = '/';
    }
  }
  
  // Ensure path starts with /
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  
  // Vercel may strip /api prefix for files in api/ directory
  // If path doesn't start with /api, add it back (unless it's already there)
  if (!path.startsWith('/api')) {
    path = '/api' + path;
  }
  
  // Preserve query string
  const query = raw.includes('?') ? raw.split('?')[1] : '';
  if (query && !path.includes('?')) {
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
