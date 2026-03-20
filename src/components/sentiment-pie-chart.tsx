"use client";

import { cn } from "@/lib/utils";

type Props = {
  positivePct: number;
  neutralPct: number;
  negativePct: number;
  className?: string;
  size?: number;
};

export function SentimentPieChart({
  positivePct,
  neutralPct,
  negativePct,
  className,
  size = 160,
}: Props) {
  const p = Math.max(0, positivePct);
  const n = Math.max(0, neutralPct);
  const neg = Math.max(0, negativePct);
  const sum = p + n + neg || 1;
  const pp = (p / sum) * 100;
  const np = (n / sum) * 100;
  const gp = (neg / sum) * 100;

  const c1 = pp;
  const c2 = pp + np;

  const gradient = `conic-gradient(
    hsl(142 55% 42%) 0% ${c1}%,
    hsl(40 90% 45%) ${c1}% ${c2}%,
    hsl(0 65% 50%) ${c2}% 100%
  )`;

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        className="rounded-full shadow-inner ring-2 ring-border/60"
        style={{
          width: size,
          height: size,
          background: gradient,
        }}
        aria-hidden
      />
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: "hsl(142 55% 42%)" }}
          />
          Positive {pp.toFixed(0)}%
        </li>
        <li className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: "hsl(40 90% 45%)" }}
          />
          Neutral {np.toFixed(0)}%
        </li>
        <li className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: "hsl(0 65% 50%)" }}
          />
          Negative {gp.toFixed(0)}%
        </li>
      </ul>
    </div>
  );
}
