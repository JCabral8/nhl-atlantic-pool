/**
 * Dedicated Vercel function for admin auth to avoid catch-all routing quirks.
 * Path: POST /api/admin/auth
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read raw body (Vercel Node runtime does not auto-parse JSON here)
    let rawBody = '';
    for await (const chunk of req) {
      rawBody += chunk;
    }

    let data = {};
    if (rawBody) {
      try {
        data = JSON.parse(rawBody);
      } catch {
        // Ignore parse error, fall back to empty object
      }
    }

    const password = data.password;
    const ADMIN_PASSWORD = 'hunter';

    if (password === ADMIN_PASSWORD) {
      return res.status(200).json({ success: true, message: 'Password validated' });
    }

    return res.status(401).json({ success: false, error: 'Invalid password' });
  } catch (error) {
    console.error('Admin auth handler error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

