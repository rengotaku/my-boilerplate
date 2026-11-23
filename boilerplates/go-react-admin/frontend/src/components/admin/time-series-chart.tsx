import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "@astryxdesign/core/theme";

import { colorForIndex, useChartColors } from "./chart-colors";

export interface TimeSeriesPoint {
  ts: string | number;
  value: number;
}

export interface TimeSeriesSeries {
  name: string;
  color?: string;
  points: TimeSeriesPoint[];
}

export interface TimeSeriesChartProps {
  series: TimeSeriesSeries[];
  height?: number;
  type?: "line" | "area";
}

type MergedRow = Record<string, string | number>;

function mergeSeries(series: TimeSeriesSeries[]): MergedRow[] {
  const byTs = new Map<string | number, MergedRow>();
  for (const s of series) {
    for (const point of s.points) {
      const existing = byTs.get(point.ts);
      if (existing) {
        existing[s.name] = point.value;
      } else {
        byTs.set(point.ts, { ts: point.ts, [s.name]: point.value });
      }
    }
  }
  return Array.from(byTs.values()).sort((a, b) => {
    if (a.ts < b.ts) return -1;
    if (a.ts > b.ts) return 1;
    return 0;
  });
}

/**
 * Recharts time-series chart. Astryx has no chart component, so the library
 * stays; the palette, grid and tick colours come from the active theme.
 */
export function TimeSeriesChart({
  series,
  height = 280,
  type = "line",
}: TimeSeriesChartProps): React.JSX.Element {
  const data = React.useMemo(() => mergeSeries(series), [series]);
  const colors = useChartColors();
  const { token } = useTheme();
  const axisTick = { fontSize: 12, fill: token("--color-text-secondary") };

  return (
    <div className="chart-box" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {type === "area" ? (
          <AreaChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={token("--color-border-emphasized")}
            />
            <XAxis dataKey="ts" tick={axisTick} />
            <YAxis tick={axisTick} />
            <Tooltip />
            <Legend />
            {series.map((s, index) => {
              const color = s.color ?? colorForIndex(colors, index);
              return (
                <Area
                  key={s.name}
                  type="monotone"
                  dataKey={s.name}
                  stroke={color}
                  fill={color}
                  fillOpacity={0.2}
                />
              );
            })}
          </AreaChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={token("--color-border-emphasized")}
            />
            <XAxis dataKey="ts" tick={axisTick} />
            <YAxis tick={axisTick} />
            <Tooltip />
            <Legend />
            {series.map((s, index) => (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={s.color ?? colorForIndex(colors, index)}
                dot={false}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
