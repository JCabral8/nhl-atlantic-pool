import type { AtlanticStanding } from "@/src/lib/standings";

export type PlayerName = "Justin" | "Chris" | "Nick";

export type TeamAbbrev = "BOS" | "BUF" | "DET" | "FLA" | "MTL" | "OTT" | "TBL" | "TOR";

type PlayerPick = {
  name: PlayerName;
  picksByRank: TeamAbbrev[];
};

export const PLAYERS: PlayerPick[] = [
  {
    name: "Justin",
    picksByRank: ["TBL", "BOS", "MTL", "FLA", "TOR", "OTT", "DET", "BUF"],
  },
  {
    name: "Chris",
    picksByRank: ["TBL", "TOR", "BOS", "DET", "FLA", "MTL", "OTT", "BUF"],
  },
  {
    name: "Nick",
    picksByRank: ["TBL", "FLA", "BOS", "DET", "TOR", "MTL", "OTT", "BUF"],
  },
];

export function pointsForDiff(rankDiff: number): number {
  if (rankDiff === 0) return 3;
  if (rankDiff === 1) return 1;
  return 0;
}

function buildActualRankMap(standings: AtlanticStanding[]): Record<string, number> {
  return standings.reduce<Record<string, number>>((acc, row) => {
    acc[row.teamAbbrev] = row.rank;
    return acc;
  }, {});
}

export type LeaderboardRow = {
  player: PlayerName;
  totalPoints: number;
};

export type TeamScoreCell = {
  player: PlayerName;
  predictedRank: number;
  rankDiff: number;
  points: number;
};

export type TeamScoreRow = {
  actualRank: number;
  teamAbbrev: string;
  cells: TeamScoreCell[];
};

export function scorePool(standings: AtlanticStanding[]): {
  leaderboard: LeaderboardRow[];
  rowsByActualRank: TeamScoreRow[];
} {
  const actualRankByTeam = buildActualRankMap(standings);
  const totals = new Map<PlayerName, number>();

  PLAYERS.forEach((player) => totals.set(player.name, 0));

  const rowsByActualRank: TeamScoreRow[] = standings
    .map((standing) => {
      const cells = PLAYERS.map((player) => {
        const predictedRank = player.picksByRank.findIndex((team) => team === standing.teamAbbrev) + 1;
        const rankDiff = Math.abs(standing.rank - predictedRank);
        const points = pointsForDiff(rankDiff);
        totals.set(player.name, (totals.get(player.name) ?? 0) + points);

        return {
          player: player.name,
          predictedRank,
          rankDiff,
          points,
        };
      });

      return {
        actualRank: standing.rank,
        teamAbbrev: standing.teamAbbrev,
        cells,
      };
    })
    .sort((a, b) => a.actualRank - b.actualRank);

  const leaderboard: LeaderboardRow[] = PLAYERS.map((player) => ({
    player: player.name,
    totalPoints: totals.get(player.name) ?? 0,
  })).sort((a, b) => b.totalPoints - a.totalPoints || a.player.localeCompare(b.player));

  // Sanity check: each player should always have all 8 Atlantic teams selected.
  PLAYERS.forEach((player) => {
    player.picksByRank.forEach((team) => {
      if (!(team in actualRankByTeam)) {
        throw new Error(`Missing Atlantic team in standings: ${team}`);
      }
    });
  });

  return { leaderboard, rowsByActualRank };
}
