/**
 * Dedicated Vercel function for standings update endpoint to avoid catch-all routing issues.
 * Path: POST /api/standings/update-now
 * Requires admin password in x-admin-password header.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Forward to Express standings router
    // Set the path to what Express expects
    req.url = '/api/standings/update-now';
    req.originalUrl = '/api/standings/update-now';
    
    const { default: app } = await import('../../backend/src/app.js');
    return new Promise((resolve, reject) => {
      res.on('finish', () => resolve());
      res.on('error', reject);
      app(req, res);
    });
  } catch (error) {
    console.error('Standings update handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
}
