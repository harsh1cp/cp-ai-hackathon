"use client";

import { useMemo, useState } from "react";
import type { BaseTickContentProps, DotItemDotProps } from "recharts/types";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";
import type { SalesCallRecord } from "@/lib/sales-call-model";

export type AgentPerformanceKey = keyof SalesCallRecord["agentPerformance"];

/** Pentagon order: top → clockwise (matches common rubric layouts). */
const AXIS_ORDER: AgentPerformanceKey[] = [
  "politeness",
  "problemHandling",
  "listeningAbility",
  "businessKnowledge",
  "communicationClarity",
];

const LABELS: Record<AgentPerformanceKey, string> = {
  communicationClarity: "Clarity",
  politeness: "Politeness",
  businessKnowledge: "Knowledge",
  problemHandling: "Problems",
  listeningAbility: "Listening",
};

type Row = {
  dimension: string;
  score: number;
  full: AgentPerformanceKey;
};

type Props = {
  performance: SalesCallRecord["agentPerformance"];
  className?: string;
};

export function AgentRadarChart({ performance, className }: Props) {
  const data: Row[] = useMemo(
    () =>
      AXIS_ORDER.map((key) => ({
        dimension: LABELS[key],
        score: Math.min(10, Math.max(0, Number(performance[key]) || 0)),
        full: key,
      })),
    [performance]
  );

  const [selected, setSelected] = useState<AgentPerformanceKey | null>(null);
  const activeKey = selected ?? AXIS_ORDER[0];
  const activeRow = data.find((d) => d.full === activeKey) ?? data[0];

  return (
    <div className={cn("grid gap-6 lg:grid-cols-[minmax(0,200px)_1fr]", className)}>
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Score detail
        </p>
        <p className="mt-2 text-lg font-semibold text-foreground">
          {activeRow.dimension}
        </p>
        <p className="mt-1 text-3xl font-semibold tabular-nums text-primary">
          {activeRow.score}
          <span className="text-lg font-medium text-muted-foreground">/10</span>
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Tap a dot or axis label to inspect another dimension.
        </p>
      </div>

      <div className="min-h-[280px] w-full" style={{ minWidth: 0 }}>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={data} cx="50%" cy="52%" outerRadius="78%">
            <PolarGrid
              stroke="hsl(var(--border))"
              strokeOpacity={0.85}
              gridType="polygon"
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 10]}
              tickCount={6}
              tick={{
                fill: "hsl(var(--muted-foreground))",
                fontSize: 10,
              }}
              axisLine={false}
            />
            <PolarAngleAxis
              dataKey="dimension"
              tick={(props: BaseTickContentProps) => {
                const row = data[props.index];
                const isActive = row?.full === activeKey;
                const label = String(props.payload?.value ?? "");
                const x = Number(props.x);
                const y = Number(props.y);
                return (
                  <text
                    x={x}
                    y={y}
                    textAnchor={props.textAnchor}
                    dominantBaseline="central"
                    fill={
                      isActive
                        ? "hsl(var(--foreground))"
                        : "hsl(var(--muted-foreground))"
                    }
                    fontSize={isActive ? 12 : 11}
                    fontWeight={isActive ? 600 : 400}
                    className="cursor-pointer select-none"
                    onClick={() => row && setSelected(row.full)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        row && setSelected(row.full);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${label}, score ${row?.score ?? ""} of 10`}
                  >
                    {label}
                  </text>
                );
              }}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke="hsl(28 32% 48%)"
              fill="hsl(28 32% 48%)"
              fillOpacity={0.32}
              strokeWidth={2}
              dot={(dotProps: DotItemDotProps) => {
                const { cx, cy, payload } = dotProps;
                if (cx == null || cy == null) return null;
                const row = payload as Row;
                const isSel = row.full === activeKey;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSel ? 6 : 4}
                    fill={isSel ? "hsl(var(--card))" : "hsl(28 32% 48%)"}
                    stroke="hsl(28 32% 48%)"
                    strokeWidth={2}
                    className="cursor-pointer"
                    onClick={() => setSelected(row.full)}
                  />
                );
              }}
              activeDot={{ r: 7, strokeWidth: 2 }}
            />
            <Tooltip
              formatter={(v) => [`${String(v ?? "")}/10`, "Score"]}
              labelFormatter={(_, items) => {
                const p = items?.[0]?.payload as Row | undefined;
                return p?.dimension ?? "";
              }}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))",
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
