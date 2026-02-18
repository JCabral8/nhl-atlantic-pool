/**
 * Vercel serverless catch-all: forwards all /api/* requests to the Express app.
 * Request path is preserved (e.g. /api/users, /api/standings).
 * Returns a Promise so the runtime waits for the response before freezing.
 */
export default async function handler(req, res) {
  // Vercel catch-all: /api/* routes here
  // For catch-all routes, Vercel may pass path segments in req.query.path as an array
  // or the full path in req.url
  let path = '/';
  
  // Try to get path from query (catch-all segments)
  if (req.query && req.query.path && Array.isArray(req.query.path)) {
    path = '/api/' + req.query.path.join('/');
  } else if (req.query && req.query.path && typeof req.query.path === 'string') {
    path = '/api/' + req.query.path;
  } else {
    // Fallback to req.url
    const raw = req.url || req.originalUrl || req.path || '/';
    path = raw;
    
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
    // If path doesn't start with /api, add it back
    if (!path.startsWith('/api')) {
      path = '/api' + path;
    }
  }
  
  // Preserve query string (but exclude the 'path' param from catch-all)
  // Extract query string from original req.url if present
  const originalUrl = req.url || '';
  const queryMatch = originalUrl.includes('?') ? originalUrl.split('?')[1] : '';
  if (queryMatch) {
    const searchParams = new URLSearchParams(queryMatch);
    searchParams.delete('path'); // Remove catch-all path param
    const queryString = searchParams.toString();
    if (queryString) {
      path = path.split('?')[0] + '?' + queryString;
    } else {
      // No remaining query params, remove ? from path
      path = path.split('?')[0];
    }
  }
  
  // Debug logging (will appear in Vercel function logs)
  if (typeof console !== 'undefined') {
    console.log(`[API Handler] req.url: ${req.url}, req.query: ${JSON.stringify(req.query)}, Final path: ${path}, Method: ${req.method}`);
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
