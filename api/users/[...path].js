/**
 * Catch-all handler for /api/users/* routes, specifically for avatar endpoints.
 * Handles routes like /api/users/justin/avatar, /api/users/nick/avatar, etc.
 * For /api/users (no sub-path), this won't match and will fall through to main catch-all.
 */
export default async function handler(req, res) {
  try {
    // Extract path segments from Vercel's catch-all parameter
    const pathSegments = req.query.path;
    const segments = Array.isArray(pathSegments) 
      ? pathSegments 
      : typeof pathSegments === 'string' 
        ? pathSegments.split('/').filter(Boolean)
        : [];
    
    // Build the full path
    const fullPath = '/api/users/' + segments.join('/');
    
    // Forward to Express users router
    req.url = fullPath;
    req.originalUrl = fullPath;
    
    const { default: app } = await import('../../backend/src/app.js');
    return new Promise((resolve, reject) => {
      res.on('finish', () => resolve());
      res.on('error', reject);
      app(req, res);
    });
  } catch (error) {
    console.error('Users catch-all handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
}
