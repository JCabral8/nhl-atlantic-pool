/**
 * Vercel serverless catch-all: forwards all /api/* requests to the Express app.
 * Request path is preserved (e.g. /api/users, /api/standings).
 * Returns a Promise so the runtime waits for the response before freezing.
 */
export default async function handler(req, res) {
  try {
    // Vercel catch-all: /api/* routes here
    // req.url contains the path after /api (e.g., /admin/auth for /api/admin/auth)
    // We need to restore the /api prefix for Express routes
    let path = req.url || req.originalUrl || '/';
    
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
    
    // Vercel strips /api prefix for files in api/ directory
    // If path doesn't start with /api, add it back
    if (!path.startsWith('/api')) {
      path = '/api' + path;
    }
    
    // Debug logging (will appear in Vercel function logs)
    if (typeof console !== 'undefined') {
      console.log(`[API Handler] req.url: ${req.url}, Final path: ${path}, Method: ${req.method}`);
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
