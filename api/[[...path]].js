/**
 * Vercel serverless catch-all: forwards all /api/* requests to the Express app.
 * Request path is preserved (e.g. /api/users, /api/standings).
 * Returns a Promise so the runtime waits for the response before freezing.
 */
export default async function handler(req, res) {
  // Ensure Express sees path-only URL (Vercel sometimes sends full URL)
  const raw = req.url || req.originalUrl || '/';
  if (!raw.startsWith('/')) {
    try {
      const u = new URL(raw);
      req.url = u.pathname + (u.search || '');
    } catch (_) {
      req.url = raw;
    }
  }
  const { default: app } = await import('../backend/src/app.js');
  return new Promise((resolve, reject) => {
    res.on('finish', () => resolve());
    res.on('error', reject);
    app(req, res);
  });
}
