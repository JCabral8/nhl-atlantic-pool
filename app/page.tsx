import Image from "next/image";
import { PLAYERS, scorePool } from "@/src/lib/pool";
import { getTeamLogoUrl } from "@/src/lib/teamLogos";
import { getAtlanticStandings } from "@/src/lib/standings";

export const revalidate = 86400;

function formatRecord(
  wins: number | null,
  losses: number | null,
  otLosses: number | null,
): string {
  if (wins === null || losses === null || otLosses === null) return "-";
  return `${wins}-${losses}-${otLosses}`;
}

function pointsChipClass(points: number): string {
  if (points === 3) {
    return "border-emerald-400/45 bg-emerald-500/15 text-emerald-200";
  }
  if (points === 1) {
    return "border-amber-400/45 bg-amber-500/15 text-amber-100";
  }
  return "border-white/10 bg-white/[0.06] text-[var(--muted)]";
}

function TeamLogo({
  abbrev,
  teamName,
  size,
  className = "",
}: {
  abbrev: string;
  teamName: string;
  size: number;
  className?: string;
}) {
  return (
    <Image
      src={getTeamLogoUrl(abbrev)}
      alt={`${teamName} logo`}
      width={size}
      height={size}
      className={`team-logo-glow shrink-0 object-contain ${className}`}
      unoptimized
    />
  );
}

export default async function Home() {
  const { standings, source, fetchedAt } = await getAtlanticStandings();
  const { leaderboard, rowsByActualRank } = scorePool(standings);

  return (
    <div className="min-h-full pb-12">
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <header className="panel panel-accent-top mb-6 rounded-2xl p-6 sm:p-8">
          <p className="font-display text-sm font-normal uppercase tracking-[0.28em] text-[var(--accent-ice)]">
            NHL Atlantic Pool
          </p>
          <h1 className="font-display mt-3 text-4xl font-normal tracking-wide text-white sm:text-5xl">
            Atlantic Division Prediction Challenge
          </h1>
          <p className="font-body mt-3 text-base text-[var(--muted)]">
            Live standings with pool scoring: exact rank ={" "}
            <span className="font-semibold text-[var(--foreground)]">3 pts</span>, off by 1 ={" "}
            <span className="font-semibold text-[var(--foreground)]">1 pt</span>, off by 2+ ={" "}
            <span className="font-semibold text-[var(--foreground)]">0</span>.
          </p>
          <p className="font-body mt-3 text-xs text-[var(--muted)]">
            Data: {source === "live" ? "Live NHL API" : "Snapshot fallback"} · Updated{" "}
            {new Date(fetchedAt).toLocaleString()}
          </p>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {leaderboard.map((entry, idx) => (
            <article
              key={entry.player}
              className="panel rounded-xl p-5 transition-colors hover:border-[var(--border-accent)]"
            >
              <p className="font-display text-2xl text-[var(--accent-ice)]">#{idx + 1}</p>
              <h2 className="font-display mt-1 text-2xl tracking-wide text-white">{entry.player}</h2>
              <p className="font-body mt-2 text-3xl font-bold tabular-nums text-white">
                {entry.totalPoints}{" "}
                <span className="text-lg font-semibold text-[var(--muted)]">pts</span>
              </p>
            </article>
          ))}
        </section>

        <section className="panel panel-accent-top overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="font-body min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-black/25 text-left">
                  <th className="sticky left-0 z-10 whitespace-nowrap bg-[#0a101c]/95 px-3 py-3 pl-4 text-xs font-bold uppercase tracking-wider text-[var(--accent-ice)] backdrop-blur-sm sm:static sm:bg-transparent sm:backdrop-blur-none">
                    Rank
                  </th>
                  <th className="sticky left-12 z-10 min-w-[200px] bg-[#0a101c]/95 px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--accent-ice)] backdrop-blur-sm sm:static sm:bg-transparent sm:backdrop-blur-none">
                    Team
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--accent-ice)]">
                    Record
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--accent-ice)]">
                    PTS
                  </th>
                  {PLAYERS.map((player) => (
                    <th
                      key={player.name}
                      className="min-w-[140px] whitespace-nowrap px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-[var(--accent-ice)]"
                    >
                      {player.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rowsByActualRank.map((row, rowIdx) => {
                  const standing = standings.find((item) => item.rank === row.actualRank);
                  if (!standing) return null;

                  return (
                    <tr
                      key={standing.teamAbbrev}
                      className={`border-t border-[var(--border)] transition-colors hover:bg-white/[0.04] ${
                        rowIdx % 2 === 1 ? "bg-white/[0.02]" : ""
                      }`}
                    >
                      <td className="sticky left-0 z-10 bg-[#0a101c]/95 px-3 py-3 pl-4 backdrop-blur-sm sm:static sm:bg-transparent sm:backdrop-blur-none">
                        <span className="font-display text-2xl tabular-nums text-white">
                          {standing.rank}
                        </span>
                      </td>
                      <td className="sticky left-12 z-10 min-w-[200px] bg-[#0a101c]/95 px-3 py-3 backdrop-blur-sm sm:static sm:bg-transparent sm:backdrop-blur-none">
                        <div className="flex items-center gap-3">
                          <TeamLogo
                            abbrev={standing.teamAbbrev}
                            teamName={standing.teamName}
                            size={44}
                          />
                          <div>
                            <div className="font-semibold text-white">{standing.teamName}</div>
                            <div className="text-xs text-[var(--muted)]">{standing.teamAbbrev}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 tabular-nums text-[var(--muted)]">
                        {formatRecord(standing.wins, standing.losses, standing.otLosses)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-bold tabular-nums text-white">
                        {standing.points ?? "—"}
                      </td>
                      {row.cells.map((cell) => (
                        <td key={cell.player} className="px-3 py-3 text-center align-middle">
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <TeamLogo
                              abbrev={standing.teamAbbrev}
                              teamName={standing.teamName}
                              size={28}
                              className="opacity-95"
                            />
                            <span className="rounded border border-white/15 bg-white/[0.08] px-2 py-0.5 font-display text-sm tabular-nums text-white">
                              #{cell.predictedRank}
                            </span>
                            <span
                              className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${pointsChipClass(cell.points)}`}
                            >
                              {cell.points} pts
                            </span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="font-body mt-8 border-t border-[var(--border)] pt-6 text-sm text-[var(--muted)]">
          Losers owe winner:{" "}
          <strong className="text-[var(--foreground)]">6 Tall Stella Artois (or equivalent)</strong>.
        </footer>
      </main>
    </div>
  );
}
