import type { ReactNode } from "react";

type HistoryChartFrameProps = {
  children: ReactNode;
  vbWidth: number;
  vbHeight: number;
  title: string;
};

/**
 * Mobile: wrapper aspect-ratio matches the SVG viewBox so scaling is uniform
 * (no stretch, no letterboxing). sm+: fixed h-80 like a desktop chart tile.
 */
export function HistoryChartFrame({ children, vbWidth, vbHeight, title }: HistoryChartFrameProps) {
  return (
    <div
      className="history-chart-frame mt-3"
      style={{ "--history-chart-ar": `${vbWidth} / ${vbHeight}` } as React.CSSProperties}
    >
      <svg
        viewBox={`0 0 ${vbWidth} ${vbHeight}`}
        className="h-full w-full rounded-xl border border-[var(--border)] bg-black/25 p-1 sm:p-1.5"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={title}
      >
        {children}
      </svg>
    </div>
  );
}
