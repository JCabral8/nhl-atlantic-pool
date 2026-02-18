#!/usr/bin/env node
/**
 * Fetches NHL Atlantic Division standings and POSTs to the app's ingest endpoint.
 * Run from GitHub Actions (or locally) with STANDINGS_INGEST_URL and STANDINGS_INGEST_SECRET.
 */
const NHL_URL = 'https://statsapi.web.nhl.com/api/v1/standings';
const ATLANTIC_TEAMS = new Set([
  'Boston Bruins', 'Buffalo Sabres', 'Detroit Red Wings', 'Florida Panthers',
  'Montreal Canadiens', 'Ottawa Senators', 'Tampa Bay Lightning', 'Toronto Maple Leafs',
]);

function parseAtlantic(apiData) {
  if (!apiData?.records) throw new Error('Invalid NHL API response');
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

async function main() {
  const baseUrl = process.env.STANDINGS_INGEST_URL || 'https://nhl-atlantic-pool.vercel.app';
  const secret = process.env.STANDINGS_INGEST_SECRET;
  if (!secret) {
    console.error('STANDINGS_INGEST_SECRET is required');
    process.exit(1);
  }

  const ingestUrl = `${baseUrl.replace(/\/$/, '')}/api/standings/ingest`;

  console.log('Fetching NHL standings...');
  const res = await fetch(NHL_URL, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`NHL API ${res.status}`);
  const data = await res.json();
  const standings = parseAtlantic(data);
  if (standings.length === 0) throw new Error('No Atlantic teams in response');

  console.log('POSTing to', ingestUrl, '...');
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
    console.error('Ingest failed:', postRes.status, text);
    process.exit(1);
  }
  console.log('OK', text);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
