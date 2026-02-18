/**
 * Dedicated Vercel function for predictions/all endpoint to avoid catch-all routing issues.
 * Path: GET /api/predictions/all
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Forward to Express predictions router
    // Set the path to what Express expects
    req.url = '/api/predictions/all';
    req.originalUrl = '/api/predictions/all';
    
    const { default: app } = await import('../../../backend/src/app.js');
    return new Promise((resolve, reject) => {
      res.on('finish', () => resolve());
      res.on('error', reject);
      app(req, res);
    });
  } catch (error) {
    console.error('Predictions all handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
}
