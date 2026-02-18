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
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    // Comprehensive logging to diagnose Vercel routing
    console.log(`[API Handler ${requestId}] Method: ${req.method}`);
    console.log(`[API Handler ${requestId}] req.url: ${req.url}`);
    console.log(`[API Handler ${requestId}] req.originalUrl: ${req.originalUrl}`);
    console.log(`[API Handler ${requestId}] req.query:`, JSON.stringify(req.query));
    console.log(`[API Handler ${requestId}] req.path: ${req.path}`);
    
    // Vercel catch-all: /api/* routes here
    // For catch-all routes [[...path]], Vercel passes path segments in req.query.path as an array
    // Example: /api/users/justin → req.query.path = ['users', 'justin']
    let path = '/';
    
    // Check for catch-all path segments first (Vercel's primary method)
    if (req.query && req.query.path !== undefined) {
      const pathSegments = Array.isArray(req.query.path) 
        ? req.query.path 
        : typeof req.query.path === 'string' 
          ? req.query.path.split('/').filter(s => s)
          : [String(req.query.path)];
      
      if (pathSegments.length > 0) {
        path = '/api/' + pathSegments.join('/');
        console.log(`[API Handler ${requestId}] Using req.query.path, normalized to: ${path}`);
      }
    }
    
    // Fallback to req.url if query.path not available
    if (path === '/') {
      const raw = req.url || req.originalUrl || req.path || '/';
      path = raw;
      
      console.log(`[API Handler ${requestId}] Using req.url fallback, raw: ${raw}`);
      
      // Handle full URLs if present
      if (path.startsWith('http')) {
        try {
          const u = new URL(path);
          path = u.pathname + (u.search || '');
          console.log(`[API Handler ${requestId}] Extracted pathname from URL: ${path}`);
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
        console.log(`[API Handler ${requestId}] Added /api prefix: ${path}`);
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
    
    console.log(`[API Handler ${requestId}] Final normalized path: ${path}`);
    
    req.url = path;
    req.originalUrl = path;

    const { default: app } = await import('../backend/src/app.js');
    
    return new Promise((resolve, reject) => {
      const handlerTimeout = setTimeout(() => {
        if (!res.headersSent) {
          console.error(`[API Handler ${requestId}] Timeout after 25s`);
          res.status(504).json({ error: 'Request timeout' });
          resolve();
        }
      }, 25000);
      
      res.on('finish', () => {
        clearTimeout(handlerTimeout);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[API Handler ${requestId}] Completed in ${duration}s, status: ${res.statusCode}`);
        resolve();
      });
      
      res.on('error', (err) => {
        clearTimeout(handlerTimeout);
        console.error(`[API Handler ${requestId}] Response error:`, err);
        reject(err);
      });
      
      app(req, res);
    });
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`[API Handler ${requestId}] Error after ${duration}s:`, error);
    console.error(`[API Handler ${requestId}] Stack:`, error.stack);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error', 
        details: error.message,
        requestId 
      });
    }
  }
}
