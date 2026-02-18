/**
 * Cron status endpoint: check cron configuration and allow manual testing.
 * GET /api/cron/status - Check if CRON_SECRET is configured
 * POST /api/cron/status - Manually trigger cron (admin only)
 */
export default async function handler(req, res) {
  const timestamp = new Date().toISOString();
  
  if (req.method === 'GET') {
    // Status check - no auth required, just shows configuration
    const cronSecretSet = !!process.env.CRON_SECRET;
    const cronSecretLength = process.env.CRON_SECRET ? process.env.CRON_SECRET.length : 0;
    
    return res.json({
      configured: cronSecretSet,
      cronSecretLength,
      timestamp,
      message: cronSecretSet 
        ? 'CRON_SECRET is configured' 
        : 'CRON_SECRET is not set. Add it in Vercel environment variables.',
      schedule: 'Daily at 8:00 UTC (configured in vercel.json)',
      endpoint: '/api/cron/standings',
    });
  }
  
  if (req.method === 'POST') {
    // Manual trigger - requires admin password
    const ADMIN_PASSWORD = 'hunter';
    const password = req.headers['x-admin-password'] || req.body?.password;
    
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ 
        success: false,
        error: 'Unauthorized - Invalid admin password',
        timestamp 
      });
    }
    
    // Check CRON_SECRET
    if (!process.env.CRON_SECRET) {
      return res.status(500).json({
        success: false,
        error: 'CRON_SECRET not configured. Set it in Vercel environment variables.',
        timestamp,
      });
    }
    
    // Manually trigger the cron endpoint
    try {
      console.log('[Cron Status] Manual trigger requested by admin');
      
      // Import and call the cron handler logic
      const cronHandler = await import('./standings.js');
      const mockReq = {
        method: 'GET',
        headers: {
          authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
      };
      
      // Create a mock response object to capture the result
      let responseData = null;
      let statusCode = 200;
      
      const mockRes = {
        status: (code) => {
          statusCode = code;
          return mockRes;
        },
        json: (data) => {
          responseData = data;
          return mockRes;
        },
        setHeader: () => mockRes,
        headersSent: false,
        on: () => {},
      };
      
      await cronHandler.default(mockReq, mockRes);
      
      return res.status(statusCode).json({
        success: responseData?.success || false,
        message: 'Cron manually triggered',
        result: responseData,
        timestamp,
      });
    } catch (error) {
      console.error('[Cron Status] Error triggering cron:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to trigger cron',
        details: error.stack,
        timestamp,
      });
    }
  }
  
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ 
    error: 'Method not allowed',
    timestamp 
  });
}
