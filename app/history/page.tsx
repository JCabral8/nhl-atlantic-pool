import Link from "next/link";
import { PLAYERS } from "@/src/lib/pool";
import { getTeamLogoUrl } from "@/src/lib/teamLogos";
import { getStandingsHistory } from "@/src/lib/history";

export const revalidate = 86400;

const CHART_COLORS: Record<string, string> = {
  Justin: "#60a5fa",
  Chris: "#34d399",
  Nick: "#f59e0b",
};

const TEAM_COLORS: Record<string, string> = {
  BOS: "#fbbf24",
  BUF: "#60a5fa",
  DET: "#ef4444",
  FLA: "#fb7185",
  MTL: "#3b82f6",
  OTT: "#f87171",
  TBL: "#38bdf8",
  TOR: "#6366f1",
};

const SCORE_TIE_OFFSETS: Record<string, number> = {
  Justin: 0.28,
  Chris: 0,
  Nick: -0.28,
};

function buildPath(
  series: number[],
  xValues: number[],
  yMapper: (value: number) => number,
): string {
  if (series.length <= 1 || xValues.length !== series.length) return "";
  return series
    .map((value, idx) => `${xValues[idx].toFixed(2)},${yMapper(value).toFixed(2)}`)
    .join(" ");
}

function sampleBiWeekly<T extends { date: string }>(entriesAsc: T[]): T[] {
  if (entriesAsc.length <= 3) return entriesAsc;
  const sampled: T[] = [];
  for (let i = 0; i < entriesAsc.length; i += 14) {
    sampled.push(entriesAsc[i]);
  }
  const last = entriesAsc[entriesAsc.length - 1];
  if (sampled[sampled.length - 1]?.date !== last.date) {
    sampled.push(last);
  }
  return sampled;
}

export default async function HistoryPage() {
  const history = await getStandingsHistory();
  const historyAsc = [...history].reverse();
  const biWeeklyHistoryAsc = sampleBiWeekly(historyAsc);
  const chartWidth = 760;
  const chartHeight = 210;
  const plotLeft = 34;
  const plotRight = chartWidth - 22;
  const plotTop = 8;
  const plotBottom = chartHeight - 10;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const buildXValues = (count: number): number[] => {
    if (count <= 1) return [plotLeft];
    const step = plotWidth / (count - 1);
    return Array.from({ length: count }, (_, idx) => plotLeft + idx * step);
  };

  const poolHistoryAsc = biWeeklyHistoryAsc;
  const poolXValues = buildXValues(poolHistoryAsc.length);
  const pointsByPlayer = Object.fromEntries(
    PLAYERS.map((player) => [
      player.name,
      poolHistoryAsc.map((day) => day.leaderboard.find((row) => row.player === player.name)?.totalPoints ?? 0),
    ]),
  ) as Record<string, number[]>;
  const scoreTrendPaths = Object.fromEntries(
    PLAYERS.map((player) => [
      player.name,
      buildPath(pointsByPlayer[player.name], poolXValues, (score) => {
        const adjusted = Math.min(24, Math.max(0, score + SCORE_TIE_OFFSETS[player.name]));
        return plotBottom - (adjusted / 24) * plotHeight;
      }),
    ]),
  ) as Record<string, string>;

  const teamXValues = buildXValues(biWeeklyHistoryAsc.length);
  const teamSeries = Object.fromEntries(
    Object.keys(TEAM_COLORS).map((team) => [
      team,
      biWeeklyHistoryAsc.map((day) => day.standings.find((row) => row.teamAbbrev === team)?.rank ?? 8),
    ]),
  ) as Record<string, number[]>;
  const teamTrendPaths = Object.fromEntries(
    Object.entries(teamSeries).map(([team, series]) => {
      const points = buildPath(series, teamXValues, (rank) => plotTop + ((rank - 1) / 7) * plotHeight);
      return [team, points];
    }),
  ) as Record<string, string>;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <header className="panel panel-accent-top mb-6 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-sm font-normal uppercase tracking-[0.28em] text-[var(--accent-ice)]">
              NHL Atlantic Pool
            </p>
            <h1 className="font-display mt-3 text-4xl font-normal tracking-wide text-white sm:text-5xl">
              Standings History
            </h1>
            <p className="font-body mt-3 text-sm text-[var(--muted)]">
              Daily snapshots from season start with leaderboard totals by day.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-md border border-[var(--border)] bg-black/25 px-3 py-2 text-sm text-white transition-colors hover:border-[var(--border-accent)]"
          >
            Back to main board
          </Link>
        </div>
      </header>

      {history.length > 1 && (
        <section className="panel mb-6 rounded-2xl p-4 sm:p-6">
          <h2 className="font-display text-2xl tracking-wide text-white sm:text-3xl">
            Team standings over time
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Atlantic rank bi-weekly (1 at top, 8 at bottom).
          </p>

          <div className="mt-4">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="h-52 w-full rounded-xl border border-[var(--border)] bg-black/25 p-2 sm:h-56"
              role="img"
              aria-label="Team standing trend chart"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((tick) => {
                const y = plotTop + ((tick - 1) / 7) * plotHeight;
                return (
                  <g key={tick}>
                    <line x1={plotLeft} y1={y} x2={plotRight} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <text x="8" y={Math.min(chartHeight - 4, y + 4)} fill="rgba(232,237,245,0.65)" fontSize="10">
                      {tick}
                    </text>
                  </g>
                );
              })}
              {Object.entries(teamTrendPaths).map(([team, points]) => {
                if (!points) return null;
                return (
                  <polyline
                    key={team}
                    fill="none"
                    stroke={TEAM_COLORS[team]}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                  />
                );
              })}
              {Object.entries(teamSeries).map(([team, series]) => {
                if (series.length === 0) return null;
                const lastRank = series[series.length - 1];
                const y = plotTop + ((lastRank - 1) / 7) * plotHeight;
                return (
                  <image
                    key={`${team}-logo`}
                    href={getTeamLogoUrl(team)}
                    x={plotRight + 2}
                    y={y - 7}
                    width="14"
                    height="14"
                    opacity="0.95"
                  />
                );
              })}
            </svg>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {Object.keys(TEAM_COLORS).map((team) => (
              <span
                key={team}
                className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-black/25 px-2.5 py-1 text-[11px] text-white"
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: TEAM_COLORS[team] }}
                />
                {team}
              </span>
            ))}
          </div>
        </section>
      )}

      {history.length > 1 && (
        <section className="panel mb-6 rounded-2xl p-4 sm:p-6">
          <h2 className="font-display text-2xl tracking-wide text-white sm:text-3xl">
            Pool score over time
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Bi-weekly total points progression. Tie lines are offset slightly for readability.
          </p>

          <div className="mt-4">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="h-52 w-full rounded-xl border border-[var(--border)] bg-black/25 p-2 sm:h-56"
              role="img"
              aria-label="Pool score trend chart"
            >
              {[0, 6, 12, 18, 24].map((tick) => {
                const y = plotBottom - (tick / 24) * plotHeight;
                return (
                  <g key={tick}>
                    <line x1={plotLeft} y1={y} x2={plotRight} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <text x="8" y={Math.max(12, y - 4)} fill="rgba(232,237,245,0.65)" fontSize="10">
                      {tick}
                    </text>
                  </g>
                );
              })}
              {PLAYERS.map((player) => {
                const points = scoreTrendPaths[player.name];
                if (!points) return null;
                return (
                  <polyline
                    key={player.name}
                    fill="none"
                    stroke={CHART_COLORS[player.name]}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                  />
                );
              })}
            </svg>
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            {PLAYERS.map((player) => (
              <span
                key={player.name}
                className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-black/25 px-3 py-1 text-xs text-white"
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[player.name] }}
                />
                {player.name}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="panel rounded-2xl p-4 sm:p-6">
        <p className="text-sm text-[var(--muted)]">
          Loaded {history.length} daily snapshots from {historyAsc[0]?.date ?? "—"} to{" "}
          {historyAsc[historyAsc.length - 1]?.date ?? "—"}.
        </p>
      </section>
    </main>
  );
}
