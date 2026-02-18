/**
 * GET /api/nhl-standings-proxy
 * Tries ESPN first (no auth, very reachable), then NHL API via proxies.
 * Returns either { standings: [...] } (normalized) or NHL raw { records: [...] }.
 */
const ESPN_URL = 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/standings';
const NHL_URL = 'https://statsapi.web.nhl.com/api/v1/standings';
const ATLANTIC_NAMES = new Set([
  'Boston Bruins', 'Buffalo Sabres', 'Detroit Red Wings', 'Florida Panthers',
  'Montreal Canadiens', 'Ottawa Senators', 'Tampa Bay Lightning', 'Toronto Maple Leafs',
]);

function parseESPN(data) {
  const out = [];
  if (!data?.children?.length && !data?.groups?.length) return out;
  const groups = data.children || data.groups || [];
  for (const group of groups) {
    const entries = group.standings?.entries || group.entries || [];
    for (const entry of entries) {
      const teamName = entry.team?.displayName || entry.team?.name || entry.displayName;
      if (!teamName || !ATLANTIC_NAMES.has(teamName)) continue;
      const stats = entry.stats || [];
      const get = (names, def = 0) => {
        const s = stats.find((x) => names.includes(String(x.name || x).toLowerCase()));
        return s?.value != null ? Number(s.value) : def;
      };
      const w = get(['wins', 'w'], 0);
      const l = get(['losses', 'l'], 0);
      const ot = get(['ot', 'otl', 'overtimelosses'], 0);
      out.push({
        team: teamName,
        gp: get(['gamesplayed', 'gp', 'games'], w + l + ot),
        w,
        l,
        otl: ot,
        pts: get(['points', 'pts', 'point'], 0),
      });
    }
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const timeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));

  // 1) ESPN first
  try {
    const espnRes = await Promise.race([
      fetch(ESPN_URL, { headers: { Accept: 'application/json' } }),
      timeout(12000),
    ]);
    if (espnRes.ok) {
      const data = await espnRes.json();
      const standings = parseESPN(data);
      if (standings.length >= 8) {
        return res.status(200).json({ standings });
      }
    }
  } catch (e) {
    console.warn('[nhl-standings-proxy] ESPN failed:', e.message);
  }

  // 2) NHL via proxies
  for (const url of [
    `https://corsproxy.io/?${encodeURIComponent(NHL_URL)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(NHL_URL)}`,
  ]) {
    try {
      const proxyRes = await Promise.race([
        fetch(url, { headers: { Accept: 'application/json' } }),
        timeout(12000),
      ]);
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data?.records) return res.status(200).json(data);
      }
    } catch (e) {
      console.warn('[nhl-standings-proxy] proxy failed:', e.message);
    }
  }

  res.status(502).json({
    error: 'Could not load standings',
    details: 'ESPN and NHL proxy attempts failed',
  });
}
