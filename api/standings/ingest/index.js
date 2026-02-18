/**
 * POST /api/standings/ingest - For GitHub Actions (Bearer STANDINGS_INGEST_SECRET).
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    req.url = '/api/standings/ingest';
    req.originalUrl = '/api/standings/ingest';
    const { default: app } = await import('../../../backend/src/app.js');
    return new Promise((resolve, reject) => {
      res.on('finish', () => resolve());
      res.on('error', reject);
      app(req, res);
    });
  } catch (error) {
    console.error('Standings ingest handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
}
