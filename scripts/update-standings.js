#!/usr/bin/env node
/**
 * Fetches NHL Atlantic Division standings from multiple internet sources and POSTs to the app.
 * Tries ESPN first (no auth, very reachable), then NHL API, then proxies.
 */
const ATLANTIC_TEAM_NAMES = new Set([
  'Boston Bruins', 'Buffalo Sabres', 'Detroit Red Wings', 'Florida Panthers',
  'Montreal Canadiens', 'Ottawa Senators', 'Tampa Bay Lightning', 'Toronto Maple Leafs',
]);

// ESPN: no auth, widely reachable
const ESPN_STANDINGS = 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/standings';
// NHL official
const NHL_STANDINGS = 'https://statsapi.web.nhl.com/api/v1/standings';

function parseFromESPN(data) {
  const out = [];
  if (!data) return out;
  const collect = (entries, isAtlantic) => {
    if (!Array.isArray(entries)) return;
    for (const entry of entries) {
      const teamName = entry.team?.displayName || entry.team?.name || entry.displayName;
      if (!teamName || !ATLANTIC_TEAM_NAMES.has(teamName)) continue;
      if (!isAtlantic && out.some((s) => s.team === teamName)) continue;
      const stats = entry.stats || [];
      const getStat = (names, def = 0) => {
        const s = stats.find((x) => names.includes(String(x.name || x).toLowerCase()));
        return s && s.value != null ? Number(s.value) : def;
      };
      const wins = getStat(['wins', 'w'], 0);
      const losses = getStat(['losses', 'l'], 0);
      const ot = getStat(['ot', 'otl', 'overtimelosses', 'ot losses'], 0);
      const pts = getStat(['points', 'pts', 'point'], 0);
      const gp = getStat(['gamesplayed', 'gp', 'games'], wins + losses + ot);
      out.push({
        team: teamName,
        gp: gp || wins + losses + ot,
        w: wins,
        l: losses,
        otl: ot,
        pts: pts,
      });
    }
  };
  const children = data.children || data.groups || [];
  for (const group of children) {
    const name = (group.name || group.abbreviation || '').toLowerCase();
    const isAtlantic = name.includes('atlantic') || name === 'atl';
    const entries = group.standings?.entries || group.entries || [];
    collect(entries, isAtlantic);
  }
  collect(data.standings?.entries || data.entries || [], true);
  return out;
}

function parseFromNHL(data) {
  if (!data?.records) return [];
  const out = [];
  for (const record of data.records) {
    if (!record.teamRecords) continue;
    for (const tr of record.teamRecords) {
      const name = tr.team?.name;
      if (name && ATLANTIC_TEAM_NAMES.has(name)) {
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

async function fetchWithTimeout(url, timeoutMs = 12000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: ac.signal,
    });
    clearTimeout(t);
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}

async function fetchStandings() {
  // 1) ESPN first (no auth, very reachable from GitHub and most networks)
  try {
    console.log('Trying ESPN...');
    const data = await fetchWithTimeout(ESPN_STANDINGS);
    const standings = parseFromESPN(data);
    if (standings.length >= 8) {
      console.log('Got', standings.length, 'teams from ESPN');
      return standings;
    }
  } catch (e) {
    console.warn('  ESPN failed:', e.message || e);
  }

  // 2) NHL API direct
  try {
    console.log('Trying NHL API...');
    const data = await fetchWithTimeout(NHL_STANDINGS);
    const standings = parseFromNHL(data);
    if (standings.length >= 8) {
      console.log('Got', standings.length, 'teams from NHL API');
      return standings;
    }
  } catch (e) {
    console.warn('  NHL API failed:', e.message || e);
  }

  // 3) NHL via proxies
  for (const proxy of [
    `https://corsproxy.io/?${encodeURIComponent(NHL_STANDINGS)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(NHL_STANDINGS)}`,
  ]) {
    try {
      console.log('Trying proxy...');
      const data = await fetchWithTimeout(proxy);
      const standings = parseFromNHL(data);
      if (standings.length >= 8) {
        console.log('Got', standings.length, 'teams from proxy');
        return standings;
      }
    } catch (e) {
      console.warn('  Proxy failed:', e.message || e);
    }
  }

  throw new Error('Could not fetch standings from ESPN, NHL API, or proxies');
}

async function main() {
  const baseUrl = process.env.STANDINGS_INGEST_URL || 'https://nhl-atlantic-pool.vercel.app';
  const secret = process.env.STANDINGS_INGEST_SECRET;
  if (!secret) {
    console.error('ERROR: STANDINGS_INGEST_SECRET is not set.');
    process.exit(1);
  }

  const ingestUrl = `${baseUrl.replace(/\/$/, '')}/api/standings/ingest`;
  const standings = await fetchStandings();

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
    console.error('INGEST FAILED:', postRes.status, text);
    if (postRes.status === 401) console.error('→ Secret mismatch (same value in GitHub and Vercel?)');
    if (postRes.status === 503) console.error('→ Add STANDINGS_INGEST_SECRET in Vercel and redeploy.');
    process.exit(1);
  }
  console.log('Done.', text);
}

main().catch((err) => {
  console.error('ERROR:', err.message || err);
  process.exit(1);
});
