import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const NHL_STANDINGS_URL = "https://api-web.nhle.com/v1/standings/now";
const ATLANTIC_TEAMS = new Set(["BOS", "BUF", "DET", "FLA", "MTL", "OTT", "TBL", "TOR"]);
const SNAPSHOT_PATH = path.join(process.cwd(), "public", "standings.snapshot.json");
const HISTORY_PATH = path.join(process.cwd(), "public", "standings.history.json");

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

  return sorted.map((row, idx) => ({
    ...row,
    rank: idx + 1,
  }));
}

async function fetchAtlanticStandings() {
  const response = await fetch(NHL_STANDINGS_URL);
  if (!response.ok) {
    throw new Error(`NHL standings request failed (${response.status})`);
  }

  const payload = await response.json();
  const rows = (payload.standings ?? [])
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
    throw new Error(`Expected 8 Atlantic teams, got ${rows.length}`);
  }

  return normalizeRankOrder(rows);
}

async function main() {
  const standings = await fetchAtlanticStandings();
  const updatedAt = new Date().toISOString();
  const snapshot = {
    updatedAt,
    source: "api-web.nhle.com",
    standings,
  };

  await writeFile(SNAPSHOT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(`Wrote standings snapshot to ${SNAPSHOT_PATH}`);

  const dateKey = updatedAt.slice(0, 10);
  let existingHistory = [];
  try {
    const rawHistory = await readFile(HISTORY_PATH, "utf8");
    const parsed = JSON.parse(rawHistory);
    existingHistory = Array.isArray(parsed.entries) ? parsed.entries : [];
  } catch {
    existingHistory = [];
  }

  const byDate = new Map();
  for (const entry of existingHistory) {
    if (entry?.date) byDate.set(entry.date, entry);
  }
  byDate.set(dateKey, { date: dateKey, updatedAt, standings });

  const mergedEntries = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  await writeFile(HISTORY_PATH, `${JSON.stringify({ entries: mergedEntries }, null, 2)}\n`, "utf8");
  console.log(`Upserted daily standings history in ${HISTORY_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
