import { readFile } from "node:fs/promises";
import path from "node:path";
import { scorePool, type LeaderboardRow } from "@/src/lib/pool";
import type { AtlanticStanding } from "@/src/lib/standings";

type HistoryEntryRaw = {
  date?: unknown;
  updatedAt?: unknown;
  standings?: unknown;
};

type HistoryFileRaw = {
  entries?: unknown;
};

export type HistoryDay = {
  date: string;
  updatedAt: string;
  standings: AtlanticStanding[];
  leaderboard: LeaderboardRow[];
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseStanding(value: unknown): AtlanticStanding | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const rank = asNumber(row.rank);
  const teamAbbrev = asString(row.teamAbbrev);
  const teamName = asString(row.teamName);
  if (rank === null || teamAbbrev === null || teamName === null) return null;

  return {
    rank,
    teamAbbrev,
    teamName,
    points: asNumber(row.points),
    wins: asNumber(row.wins),
    losses: asNumber(row.losses),
    otLosses: asNumber(row.otLosses),
    gamesPlayed: asNumber(row.gamesPlayed),
  };
}

function parseHistoryEntry(value: unknown): HistoryDay | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as HistoryEntryRaw;
  const date = asString(raw.date);
  const updatedAt = asString(raw.updatedAt);
  const standingsRaw = Array.isArray(raw.standings) ? raw.standings : [];
  const standings = standingsRaw
    .map(parseStanding)
    .filter((row): row is AtlanticStanding => row !== null)
    .sort((a, b) => a.rank - b.rank);

  if (!date || standings.length !== 8) return null;

  const { leaderboard } = scorePool(standings);
  return { date, updatedAt: updatedAt ?? `${date}T12:00:00.000Z`, standings, leaderboard };
}

export async function getStandingsHistory(): Promise<HistoryDay[]> {
  try {
    const historyPath = path.join(process.cwd(), "public", "standings.history.json");
    const raw = await readFile(historyPath, "utf8");
    const parsed = JSON.parse(raw) as HistoryFileRaw;
    const entries = Array.isArray(parsed.entries) ? parsed.entries : [];

    return entries
      .map(parseHistoryEntry)
      .filter((entry): entry is HistoryDay => entry !== null)
      .sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}
