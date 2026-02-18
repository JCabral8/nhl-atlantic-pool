/**
 * Dedicated Vercel function for admin database endpoint to avoid catch-all routing quirks.
 * Path: GET /api/admin/database
 * Proxies to Express admin router with proper path handling.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Forward to Express admin router
    // Set the path to what Express expects
    req.url = '/api/admin/database';
    req.originalUrl = '/api/admin/database';
    
    const { default: app } = await import('../../backend/src/app.js');
    return new Promise((resolve, reject) => {
      res.on('finish', () => resolve());
      res.on('error', reject);
      app(req, res);
    });
  } catch (error) {
    console.error('Admin database handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
}
