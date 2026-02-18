#!/usr/bin/env node
/**
 * Fetches NHL Atlantic Division standings and POSTs to the app's ingest endpoint.
 * Tries direct NHL API first, then CORS proxies. Run from GitHub Actions with
 * STANDINGS_INGEST_URL and STANDINGS_INGEST_SECRET.
 */
const NHL_URL = 'https://statsapi.web.nhl.com/api/v1/standings';
const PROXY_URLS = [
  NHL_URL,
  `https://corsproxy.io/?${encodeURIComponent(NHL_URL)}`,
  `https://api.allorigins.win/raw?url=${encodeURIComponent(NHL_URL)}`,
];

const ATLANTIC_TEAMS = new Set([
  'Boston Bruins', 'Buffalo Sabres', 'Detroit Red Wings', 'Florida Panthers',
  'Montreal Canadiens', 'Ottawa Senators', 'Tampa Bay Lightning', 'Toronto Maple Leafs',
]);

function parseAtlantic(apiData) {
  if (!apiData?.records) throw new Error('Invalid NHL API response: no records');
  const out = [];
  for (const record of apiData.records) {
    if (!record.teamRecords) continue;
    for (const tr of record.teamRecords) {
      const name = tr.team?.name;
      if (name && ATLANTIC_TEAMS.has(name)) {
        const stats = tr.leagueRecord || {};
        const stand = tr.standings || {};
        out.push({
          team: name,
          gp: Number(stand.gamesPlayed ?? (stats.wins + stats.losses + (stats.ot || 0)) ?? 0),
          w: Number(stats.wins || 0),
          l: Number(stats.losses || 0),
          otl: Number(stats.ot || 0),
          pts: Number(stand.points ?? tr.points ?? 0),
        });
      }
    }
  }
  return out;
}

async function fetchNHL() {
  let lastErr;
  for (const url of PROXY_URLS) {
    try {
      const label = url === NHL_URL ? 'NHL API' : 'proxy';
      console.log('Trying', label, '...');
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), 15000);
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: ac.signal,
      });
      clearTimeout(t);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const standings = parseAtlantic(data);
      if (standings.length >= 8) {
        console.log('Got', standings.length, 'teams from', label);
        return standings;
      }
    } catch (e) {
      lastErr = e;
      console.warn('  failed:', e.message || e);
    }
  }
  throw lastErr || new Error('All fetch attempts failed');
}

async function main() {
  const baseUrl = process.env.STANDINGS_INGEST_URL || 'https://nhl-atlantic-pool.vercel.app';
  const secret = process.env.STANDINGS_INGEST_SECRET;
  if (!secret) {
    console.error('ERROR: STANDINGS_INGEST_SECRET is not set.');
    console.error('Add it in GitHub repo → Settings → Secrets and variables → Actions → STANDINGS_INGEST_SECRET');
    process.exit(1);
  }

  const ingestUrl = `${baseUrl.replace(/\/$/, '')}/api/standings/ingest`;

  const standings = await fetchNHL();

  console.log('POSTing to app...');
  const postRes = await fetch(ingestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ standings }),
  });
  const text = await postRes.text();
  if (!postRes.ok) {
    console.error('INGEST FAILED:', postRes.status, postRes.statusText);
    console.error('Response:', text);
    if (postRes.status === 401) {
      console.error('→ Secret mismatch. Use the SAME value for STANDINGS_INGEST_SECRET in both GitHub and Vercel.');
    }
    if (postRes.status === 503) {
      console.error('→ Add STANDINGS_INGEST_SECRET in Vercel (Project → Settings → Environment Variables), then redeploy.');
    }
    process.exit(1);
  }
  console.log('Done.', text);
}

main().catch((err) => {
  console.error('ERROR:', err.message || err);
  process.exit(1);
});
