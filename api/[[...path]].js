/**
 * Vercel serverless catch-all: forwards all /api/* requests to the Express app.
 * Request path is preserved (e.g. /api/users, /api/standings).
 */
export default async function handler(req, res) {
  const { default: app } = await import('../backend/src/app.js');
  return app(req, res);
}
