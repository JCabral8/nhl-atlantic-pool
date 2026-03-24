import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const NHL_STANDINGS_NOW_URL = "https://api-web.nhle.com/v1/standings/now";
const NHL_STANDINGS_BY_DATE_URL = "https://api-web.nhle.com/v1/standings";
const ATLANTIC_TEAMS = new Set(["BOS", "BUF", "DET", "FLA", "MTL", "OTT", "TBL", "TOR"]);
const THROTTLE_MS = 150;
const RETRIES = 2;

function asNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function getTeamAbbrev(raw) {
  if (!raw || typeof raw !== "object") return null;
  return asString(raw.default);
}

function getTeamName(raw) {
  if (!raw || typeof raw !== "object") return null;
  return asString(raw.default);
}

function normalizeRankOrder(rows) {
  const hasDivisionRank = rows.some((row) => row.rank !== 999);
  const sorted = [...rows].sort((a, b) => {
    if (hasDivisionRank) return a.rank - b.rank;
    const byPoints = (b.points ?? -1) - (a.points ?? -1);
    if (byPoints !== 0) return byPoints;
    const byWins = (b.wins ?? -1) - (a.wins ?? -1);
    if (byWins !== 0) return byWins;
    return a.teamAbbrev.localeCompare(b.teamAbbrev);
  });
  return sorted.map((row, idx) => ({ ...row, rank: idx + 1 }));
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function parseArgs(argv) {
  const args = new Map();
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
      args.set(key, value);
    }
  }
  return args;
}

function getDefaultSeasonStart() {
  const now = new Date();
  const year = now.getUTCMonth() >= 8 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  return `${year}-09-15`;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function extractAtlanticStandings(payload) {
  const rows = (payload?.standings ?? [])
    .map((entry) => {
      const teamAbbrev = getTeamAbbrev(entry.teamAbbrev);
      const teamName = getTeamName(entry.teamName);
      if (!teamAbbrev || !teamName || !ATLANTIC_TEAMS.has(teamAbbrev)) {
        return null;
      }

      return {
        rank: asNumber(entry.divisionSequence) ?? 999,
        teamAbbrev,
        teamName,
        points: asNumber(entry.points),
        wins: asNumber(entry.wins),
        losses: asNumber(entry.losses),
        otLosses: asNumber(entry.otLosses),
        gamesPlayed: asNumber(entry.gamesPlayed),
      };
    })
    .filter(Boolean);

  if (rows.length !== 8) {
    return null;
  }

  return normalizeRankOrder(rows);
}

async function fetchStandingsPayload(dateKey) {
  const urls = dateKey
    ? [`${NHL_STANDINGS_BY_DATE_URL}/${dateKey}`]
    : [NHL_STANDINGS_NOW_URL];

  let lastError = null;
  for (const url of urls) {
    for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Request failed (${response.status}) for ${url}`);
        }
        return await response.json();
      } catch (error) {
        lastError = error;
        if (attempt < RETRIES) {
          await sleep(THROTTLE_MS * (attempt + 1));
        }
      }
    }
  }

  throw lastError ?? new Error(`Unable to fetch standings for ${dateKey ?? "now"}`);
}

async function readHistoryFile(historyPath) {
  try {
    const raw = await readFile(historyPath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.entries) ? parsed.entries : [];
  } catch {
    return [];
  }
}

function mergeEntries(existingEntries, newEntries) {
  const byDate = new Map();
  for (const entry of existingEntries) {
    if (entry?.date) byDate.set(entry.date, entry);
  }
  for (const entry of newEntries) {
    byDate.set(entry.date, entry);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const from = args.get("from") ?? getDefaultSeasonStart();
  const to = args.get("to") ?? formatDate(new Date());
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    throw new Error("Invalid date range. Use --from YYYY-MM-DD --to YYYY-MM-DD");
  }

  const historyPath = path.join(process.cwd(), "public", "standings.history.json");
  const existingEntries = await readHistoryFile(historyPath);
  const generated = [];

  let attempted = 0;
  let written = 0;
  let skipped = 0;
  let failed = 0;

  for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const dateKey = formatDate(cursor);
    attempted += 1;

    try {
      const payload = await fetchStandingsPayload(dateKey);
      const standings = extractAtlanticStandings(payload);
      if (!standings) {
        skipped += 1;
        await sleep(THROTTLE_MS);
        continue;
      }

      generated.push({
        date: dateKey,
        updatedAt: `${dateKey}T12:00:00.000Z`,
        standings,
      });
      written += 1;
    } catch (error) {
      failed += 1;
      console.warn(`Backfill failed for ${dateKey}: ${error.message}`);
    }

    await sleep(THROTTLE_MS);
  }

  const mergedEntries = mergeEntries(existingEntries, generated);
  await writeFile(historyPath, `${JSON.stringify({ entries: mergedEntries }, null, 2)}\n`, "utf8");

  console.log(
    `Backfill complete. attempted=${attempted} written=${written} skipped=${skipped} failed=${failed} totalEntries=${mergedEntries.length}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
