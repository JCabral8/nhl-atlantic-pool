/**
 * Catch-all handler for /api/users/* routes, specifically for avatar endpoints.
 * Handles routes like /api/users/justin/avatar, /api/users/nick/avatar, etc.
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
    
    // Only handle avatar routes (e.g., /api/users/justin/avatar)
    if (segments.length === 2 && segments[1] === 'avatar') {
      const userName = segments[0];
      
      // Forward to Express users router
      req.url = `/api/users/${userName}/avatar`;
      req.originalUrl = `/api/users/${userName}/avatar`;
      
      const { default: app } = await import('../../backend/src/app.js');
      return new Promise((resolve, reject) => {
        res.on('finish', () => resolve());
        res.on('error', reject);
        app(req, res);
      });
    }
    
    // For other /api/users/* routes, let the main catch-all handle it
    // Return 404 to let Vercel fall through to the main catch-all
    res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('Users catch-all handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
}
