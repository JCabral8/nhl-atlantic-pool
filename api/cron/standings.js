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

  console.log('[Cron Standings] Authentication successful, starting standings update...');

  try {
    const { updateStandings } = await import('../../backend/src/services/standingsUpdater.js');
    const result = await updateStandings();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (result.success) {
      console.log(`[Cron Standings] ✅ Successfully updated ${result.updated || 0} teams in ${duration}s`);
      res.status(200).json({
        ...result,
        timestamp,
        duration: `${duration}s`,
        source: 'cron',
      });
    } else {
      console.error(`[Cron Standings] ❌ Update failed: ${result.error || 'Unknown error'}`);
      res.status(500).json({
        ...result,
        timestamp,
        duration: `${duration}s`,
        source: 'cron',
      });
    }
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`[Cron Standings] ❌ Exception after ${duration}s:`, error);
    console.error('[Cron Standings] Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error occurred',
      details: error.stack,
      timestamp,
      duration: `${duration}s`,
      source: 'cron',
    });
  }
}
