/**
 * Dedicated Vercel function for standings last-updated endpoint to avoid catch-all routing issues.
 * Path: GET /api/standings/last-updated
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Forward to Express standings router
    // Set the path to what Express expects
    req.url = '/api/standings/last-updated';
    req.originalUrl = '/api/standings/last-updated';
    
    const { default: app } = await import('../../backend/src/app.js');
    return new Promise((resolve, reject) => {
      res.on('finish', () => resolve());
      res.on('error', reject);
      app(req, res);
    });
  } catch (error) {
    console.error('Standings last-updated handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
}
