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
  try {
    // Vercel catch-all: /api/* routes here
    // For catch-all routes [[...path]], Vercel may pass path segments in req.query.path
    // or the path in req.url (which may or may not include /api prefix)
    let path = '/';
    
    // Check for catch-all path segments first (Vercel may use this)
    if (req.query && req.query.path) {
      const pathSegments = Array.isArray(req.query.path) 
        ? req.query.path 
        : [req.query.path];
      path = '/api/' + pathSegments.join('/');
    } else {
      // Fallback to req.url
      const raw = req.url || req.originalUrl || '/';
      path = raw;
      
      // Handle full URLs if present
      if (path.startsWith('http')) {
        try {
          const u = new URL(path);
          path = u.pathname + (u.search || '');
        } catch {
          path = '/';
        }
      }
      
      // Ensure path starts with /
      if (!path.startsWith('/')) {
        path = '/' + path;
      }
      
      // Vercel strips /api prefix for files in api/ directory
      // If path doesn't start with /api, add it back
      if (!path.startsWith('/api')) {
        path = '/api' + path;
      }
    }
    
    // Preserve query string (excluding catch-all path param)
    const originalUrl = req.url || '';
    if (originalUrl.includes('?')) {
      const queryPart = originalUrl.split('?')[1];
      const params = new URLSearchParams(queryPart);
      params.delete('path'); // Remove catch-all path param
      const remainingQuery = params.toString();
      if (remainingQuery) {
        path = path.split('?')[0] + '?' + remainingQuery;
      }
    }
    
    req.url = path;
    req.originalUrl = path;

    const { default: app } = await import('../backend/src/app.js');
    return new Promise((resolve, reject) => {
      res.on('finish', () => resolve());
      res.on('error', reject);
      app(req, res);
    });
  } catch (error) {
    console.error('[API Handler] Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
}
