/**
 * Dedicated Vercel function for user avatar endpoint to avoid catch-all routing issues.
 * Path: GET /api/users/:name/avatar
 * Accepts user names like 'nick', 'justin', 'chris'
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract the name from Vercel's dynamic route parameter
    const name = req.query.name;
    if (!name) {
      return res.status(400).json({ error: 'User name is required' });
    }
    
    // Forward to Express users router
    // Set the path to what Express expects
    req.url = `/api/users/${name}/avatar`;
    req.originalUrl = `/api/users/${name}/avatar`;
    
    const { default: app } = await import('../../../backend/src/app.js');
    return new Promise((resolve, reject) => {
      res.on('finish', () => resolve());
      res.on('error', reject);
      app(req, res);
    });
  } catch (error) {
    console.error('User avatar handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
}
