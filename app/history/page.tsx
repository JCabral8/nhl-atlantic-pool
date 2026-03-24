import Image from "next/image";
import Link from "next/link";
import { HistoryChartFrame } from "./HistoryChartFrame";
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
  const chartWidth = 640;
  /* Taller viewBox → more vertical rank/score separation when scaled uniformly on phones */
  const chartHeight = 360;
  const plotLeft = 26;
  const plotRight = chartWidth - 58;
  const plotTop = 10;
  const plotBottom = chartHeight - 12;
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
  const allPoolScores = Object.values(pointsByPlayer).flat();
  const maxPoolScoreRaw = allPoolScores.length > 0 ? Math.max(...allPoolScores) : 0;
  const scoreAxisMax = Math.max(6, Math.ceil((maxPoolScoreRaw + 1) / 2) * 2);
  const scoreTickStep = Math.max(1, Math.ceil(scoreAxisMax / 4));
  const scoreTicks = Array.from({ length: 5 }, (_, idx) => {
    const value = Math.min(scoreAxisMax, idx * scoreTickStep);
    return value;
  }).filter((value, idx, arr) => idx === 0 || value > arr[idx - 1]);

  const scoreTrendPaths = Object.fromEntries(
    PLAYERS.map((player) => [
      player.name,
      buildPath(pointsByPlayer[player.name], poolXValues, (score) => {
        const adjusted = Math.min(scoreAxisMax, Math.max(0, score + SCORE_TIE_OFFSETS[player.name]));
        return plotBottom - (adjusted / scoreAxisMax) * plotHeight;
      }),
    ]),
  ) as Record<string, string>;
  const scoreYValues = Object.fromEntries(
    PLAYERS.map((player) => [
      player.name,
      pointsByPlayer[player.name].map((score) => {
        const adjusted = Math.min(scoreAxisMax, Math.max(0, score + SCORE_TIE_OFFSETS[player.name]));
        return plotBottom - (adjusted / scoreAxisMax) * plotHeight;
      }),
    ]),
  ) as Record<string, number[]>;
  const playerLabelPositions = (() => {
    const ends = PLAYERS.map((player) => ({
      player: player.name,
      y: scoreYValues[player.name]?.[scoreYValues[player.name].length - 1] ?? plotBottom,
    })).sort((a, b) => a.y - b.y);

    const groups: Array<Array<{ player: string; y: number }>> = [];
    for (const item of ends) {
      const current = groups[groups.length - 1];
      if (!current || Math.abs(item.y - current[current.length - 1].y) > 12) {
        groups.push([item]);
      } else {
        current.push(item);
      }
    }

    const result: Record<string, { x: number; y: number }> = {};
    groups.forEach((group) => {
      group.forEach((item, idx) => {
        const yOffset = (idx - (group.length - 1) / 2) * 10;
        result[item.player] = {
          x: plotRight + 8 + idx * 24,
          y: item.y + yOffset,
        };
      });
    });
    return result;
  })();

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

          <HistoryChartFrame
            vbWidth={chartWidth}
            vbHeight={chartHeight}
            title="Team standing trend chart"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((tick) => {
                const y = plotTop + ((tick - 1) / 7) * plotHeight;
                return (
                  <g key={tick}>
                    <line x1={plotLeft} y1={y} x2={plotRight} y2={y} stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
                    <text x="8" y={Math.min(chartHeight - 4, y + 4)} fill="rgba(232,237,245,0.9)" fontSize="12">
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
                    strokeWidth="3.4"
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
                    y={y - 10}
                    width="20"
                    height="20"
                    opacity="0.95"
                  />
                );
              })}
          </HistoryChartFrame>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-1.5">
            {Object.keys(TEAM_COLORS).map((team) => (
              <span
                key={team}
                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-[var(--border)] bg-black/25 px-1.5 py-1 text-[10px] text-white"
              >
                <Image
                  src={getTeamLogoUrl(team)}
                  alt={`${team} logo`}
                  width={16}
                  height={16}
                  className="team-logo-glow h-3.5 w-3.5 object-contain"
                  unoptimized
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
            Bi-weekly total points progression with dynamic score axis.
          </p>

          <HistoryChartFrame
            vbWidth={chartWidth}
            vbHeight={chartHeight}
            title="Pool score trend chart"
          >
            {scoreTicks.map((tick) => {
                const y = plotBottom - (tick / scoreAxisMax) * plotHeight;
                return (
                  <g key={tick}>
                    <line x1={plotLeft} y1={y} x2={plotRight} y2={y} stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
                    <text x="8" y={Math.max(12, y - 4)} fill="rgba(232,237,245,0.9)" fontSize="12">
                      {tick}
                    </text>
                  </g>
                );
              })}
              {PLAYERS.map((player) => {
                const points = scoreTrendPaths[player.name];
                const yPoints = scoreYValues[player.name] ?? [];
                if (!points) return null;
                const labelPos = playerLabelPositions[player.name] ?? { x: plotRight + 8, y: plotBottom };
                return (
                  <g key={player.name}>
                    <polyline
                      fill="none"
                      stroke={CHART_COLORS[player.name]}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={points}
                    />
                    {poolXValues.map((x, idx) => (
                      <circle
                        key={`${player.name}-${idx}`}
                        cx={x}
                        cy={yPoints[idx]}
                        r="2.3"
                        fill={CHART_COLORS[player.name]}
                      />
                    ))}
                    {yPoints.length > 0 && (
                      <g>
                        <rect
                          x={labelPos.x}
                          y={labelPos.y - 8}
                          rx="3"
                          ry="3"
                          width="22"
                          height="16"
                          fill="rgba(8, 15, 28, 0.9)"
                          stroke={CHART_COLORS[player.name]}
                          strokeWidth="1"
                        />
                        <text
                          x={labelPos.x + 11}
                          y={labelPos.y + 3}
                          fill={CHART_COLORS[player.name]}
                          fontSize="10"
                          textAnchor="middle"
                        >
                          {player.name.charAt(0)}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
          </HistoryChartFrame>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
            {PLAYERS.map((player) => (
              <span
                key={player.name}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-black/25 px-3 py-1 text-xs text-white"
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
