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

import { cn } from "@/lib/utils";
import { colorForIndex } from "./chart-colors";

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
  className?: string;
}

export function StackedBarChart({
  data,
  xKey,
  series,
  height = 280,
  className,
}: StackedBarChartProps): React.JSX.Element {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          {series.map((s, index) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label ?? s.key}
              stackId="a"
              fill={s.color ?? colorForIndex(index)}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
