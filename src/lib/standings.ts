import { readFile } from "node:fs/promises";
import path from "node:path";

const NHL_STANDINGS_URL = "https://api-web.nhle.com/v1/standings/now";

export const REVALIDATE_SECONDS = 60 * 60 * 24; // daily refresh

const ATLANTIC_TEAM_ABBREVS = new Set([
  "BOS",
  "BUF",
  "DET",
  "FLA",
  "MTL",
  "OTT",
  "TBL",
  "TOR",
]);

export type AtlanticStanding = {
  rank: number;
  teamAbbrev: string;
  teamName: string;
  points: number | null;
  wins: number | null;
  losses: number | null;
  otLosses: number | null;
  gamesPlayed: number | null;
};

type StandingsResponse = {
  standings?: unknown[];
};

type SnapshotResponse = {
  updatedAt?: unknown;
  standings?: unknown[];
};

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function getLocalizedName(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const maybeDefault = (raw as { default?: unknown }).default;
  return asString(maybeDefault);
}

function getTeamAbbrev(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  return asString((raw as { default?: unknown }).default);
}

function toStandingEntry(raw: unknown): AtlanticStanding | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const teamAbbrev = getTeamAbbrev(row.teamAbbrev);
  const teamName = getLocalizedName(row.teamName);
  if (!teamAbbrev || !teamName || !ATLANTIC_TEAM_ABBREVS.has(teamAbbrev)) {
    return null;
  }

  return {
    rank: asNumber(row.divisionSequence) ?? 999,
    teamAbbrev,
    teamName,
    points: asNumber(row.points),
    wins: asNumber(row.wins),
    losses: asNumber(row.losses),
    otLosses: asNumber(row.otLosses),
    gamesPlayed: asNumber(row.gamesPlayed),
  };
}

function normalizeRankOrder(rows: AtlanticStanding[]): AtlanticStanding[] {
  const hasDivisionRank = rows.some((r) => r.rank !== 999);
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

export type StandingsPayload = {
  standings: AtlanticStanding[];
  source: "live" | "snapshot";
  fetchedAt: string;
};

const SNAPSHOT_STANDINGS: AtlanticStanding[] = [
  { rank: 1, teamAbbrev: "BOS", teamName: "Boston Bruins", points: 36, wins: 18, losses: 13, otLosses: 0, gamesPlayed: 31 },
  { rank: 2, teamAbbrev: "TBL", teamName: "Tampa Bay Lightning", points: 36, wins: 17, losses: 11, otLosses: 2, gamesPlayed: 30 },
  { rank: 3, teamAbbrev: "DET", teamName: "Detroit Red Wings", points: 35, wins: 16, losses: 11, otLosses: 3, gamesPlayed: 30 },
  { rank: 4, teamAbbrev: "MTL", teamName: "Montreal Canadiens", points: 33, wins: 15, losses: 11, otLosses: 3, gamesPlayed: 29 },
  { rank: 5, teamAbbrev: "TOR", teamName: "Toronto Maple Leafs", points: 32, wins: 14, losses: 11, otLosses: 4, gamesPlayed: 29 },
  { rank: 6, teamAbbrev: "FLA", teamName: "Florida Panthers", points: 30, wins: 14, losses: 12, otLosses: 2, gamesPlayed: 28 },
  { rank: 7, teamAbbrev: "OTT", teamName: "Ottawa Senators", points: 30, wins: 13, losses: 12, otLosses: 4, gamesPlayed: 29 },
  { rank: 8, teamAbbrev: "BUF", teamName: "Buffalo Sabres", points: 28, wins: 12, losses: 14, otLosses: 4, gamesPlayed: 30 },
];

function isValidStanding(row: unknown): row is AtlanticStanding {
  if (!row || typeof row !== "object") return false;
  const candidate = row as Record<string, unknown>;
  const teamAbbrev = asString(candidate.teamAbbrev);
  const teamName = asString(candidate.teamName);
  const rank = asNumber(candidate.rank);
  return (
    teamAbbrev !== null &&
    teamName !== null &&
    rank !== null &&
    ATLANTIC_TEAM_ABBREVS.has(teamAbbrev)
  );
}

async function readSnapshotFromFile(): Promise<StandingsPayload | null> {
  try {
    const snapshotPath = path.join(process.cwd(), "public", "standings.snapshot.json");
    const raw = await readFile(snapshotPath, "utf8");
    const parsed = JSON.parse(raw) as SnapshotResponse;
    const standings = (parsed.standings ?? []).filter(isValidStanding);
    if (standings.length !== 8) {
      return null;
    }

    return {
      standings: normalizeRankOrder(standings),
      source: "snapshot",
      fetchedAt: asString(parsed.updatedAt) ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function getAtlanticStandings(): Promise<StandingsPayload> {
  const snapshotFromFile = await readSnapshotFromFile();
  if (snapshotFromFile) {
    return snapshotFromFile;
  }

  try {
    const response = await fetch(NHL_STANDINGS_URL, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) {
      throw new Error(`NHL standings request failed (${response.status})`);
    }

    const json = (await response.json()) as StandingsResponse;
    const rows = (json.standings ?? [])
      .map(toStandingEntry)
      .filter((row): row is AtlanticStanding => row !== null);

    if (rows.length !== 8) {
      throw new Error(`Expected 8 Atlantic teams, got ${rows.length}`);
    }

    return {
      standings: normalizeRankOrder(rows),
      source: "live",
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return {
      standings: SNAPSHOT_STANDINGS,
      source: "snapshot",
      fetchedAt: new Date().toISOString(),
    };
  }
}
