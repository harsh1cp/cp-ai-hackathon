"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const AGENT = "hsl(24 35% 38%)";
const CUSTOMER = "hsl(142 45% 42%)";
const TARGET_AGENT = 60;
const TARGET_CUSTOMER = 40;

type Props = {
  repPct: number;
  className?: string;
};

export function TalkTimePie({ repPct, className }: Props) {
  const agent = Math.min(100, Math.max(0, repPct));
  const customer = 100 - agent;
  const data = [
    { name: "Agent (rep)", value: agent, color: AGENT },
    { name: "Customer", value: customer, color: CUSTOMER },
  ];

  return (
    <div className={className}>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={80}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => `${String(v ?? "")}%`}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Coach target mix:{" "}
        <span className="font-medium text-foreground">
          {TARGET_AGENT}% agent / {TARGET_CUSTOMER}% customer
        </span>
      </p>
    </div>
  );
}
