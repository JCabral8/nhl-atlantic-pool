/**
 * Dedicated Vercel function: GET /api/nhl-standings-proxy
 * Fetches NHL standings via CORS proxies so the browser never touches the NHL domain.
 */
const NHL_URL = 'https://statsapi.web.nhl.com/api/v1/standings';

const PROXIES = [
  () => `https://corsproxy.io/?${encodeURIComponent(NHL_URL)}`,
  () => `https://api.allorigins.win/raw?url=${encodeURIComponent(NHL_URL)}`,
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let lastError;
  for (const getUrl of PROXIES) {
    try {
      const url = getUrl();
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 15000);
      const proxyRes = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(t);
      if (!proxyRes.ok) throw new Error(`Proxy ${proxyRes.status}`);
      const data = await proxyRes.json();
      if (data?.records) {
        return res.status(200).json(data);
      }
      throw new Error('Invalid response format');
    } catch (e) {
      lastError = e;
      console.warn('[nhl-standings-proxy] attempt failed:', e.message);
    }
  }

  console.error('[nhl-standings-proxy] all proxies failed:', lastError?.message);
  res.status(502).json({
    error: 'Could not load NHL standings',
    details: lastError?.message || 'All proxy attempts failed',
  });
}
