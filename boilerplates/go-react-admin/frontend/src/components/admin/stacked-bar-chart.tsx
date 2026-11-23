import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "@astryxdesign/core/theme";

import { colorForIndex, useChartColors } from "./chart-colors";

export interface StackedBarSeries {
  key: string;
  label?: string;
  color?: string;
}

export interface StackedBarChartProps {
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: StackedBarSeries[];
  height?: number;
}

/**
 * Recharts stacked bars. Series colours are the theme's data-visualisation
 * tokens, resolved through useTheme so light/dark stay consistent.
 */
export function StackedBarChart({
  data,
  xKey,
  series,
  height = 280,
}: StackedBarChartProps): React.JSX.Element {
  const colors = useChartColors();
  const { token } = useTheme();
  const axisTick = { fontSize: 12, fill: token("--color-text-secondary") };

  return (
    <div className="chart-box" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={token("--color-border-emphasized")}
          />
          <XAxis dataKey={xKey} tick={axisTick} />
          <YAxis tick={axisTick} />
          <Tooltip />
          <Legend />
          {series.map((s, index) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label ?? s.key}
              stackId="a"
              fill={s.color ?? colorForIndex(colors, index)}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
