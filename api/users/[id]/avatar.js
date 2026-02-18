/**
 * Dedicated Vercel function for GET /api/users/:id/avatar (id can be name or numeric).
 */
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const id = req.query.id;
  if (!id) {
    return res.status(400).json({ error: 'User id or name required' });
  }
  try {
    req.url = `/api/users/${id}/avatar`;
    req.originalUrl = req.url;
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
