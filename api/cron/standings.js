/**
 * Vercel Cron: update NHL standings on a schedule.
 * Secured by CRON_SECRET (sent as Bearer token by Vercel).
 * Configure in vercel.json crons (e.g. daily).
 */
export default async function handler(req, res) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  console.log(`[Cron Standings] ${timestamp} - Request received (method: ${req.method})`);

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed',
      timestamp 
    });
  }

  // Check CRON_SECRET configuration
  const authHeader = req.headers?.authorization;
  const cronSecretSet = !!process.env.CRON_SECRET;
  
  if (!cronSecretSet) {
    console.error('[Cron Standings] CRON_SECRET environment variable is not set');
    return res.status(500).json({ 
      success: false, 
      error: 'CRON_SECRET not configured. Set it in Vercel environment variables.',
      timestamp,
      configured: false,
    });
  }

  if (!authHeader) {
    console.error('[Cron Standings] Missing Authorization header');
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized - Missing Authorization header',
      timestamp 
    });
  }

  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  if (authHeader !== expectedAuth) {
    console.error('[Cron Standings] Invalid Authorization token');
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized - Invalid CRON_SECRET',
      timestamp 
    });
  }

  // NHL API is unreachable from Vercel serverless. Standings are updated only via Admin page.
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('[Cron Standings] No-op: use Admin page "Update NHL standings" to update.');
  res.status(200).json({
    success: true,
    message: 'Standings are updated from the Admin page only. Use "Update NHL standings" button.',
    timestamp,
    duration: `${duration}s`,
    source: 'cron',
  });
}
