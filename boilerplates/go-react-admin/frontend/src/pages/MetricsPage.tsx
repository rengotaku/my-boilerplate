import { useMemo, useState } from "react";
import { PeriodPicker } from "@/components/admin/period-picker";
import { GroupByTabs } from "@/components/admin/group-by-tabs";
import { TimeSeriesChart } from "@/components/admin/time-series-chart";
import { StackedBarChart } from "@/components/admin/stacked-bar-chart";
import { useMetrics } from "@/hooks/useMetrics";
import type { MetricSeries } from "@/types/run";

const PERIOD_TO_BUCKET: Record<string, string> = {
  "1h": "5m",
  "24h": "1h",
  "7d": "1d",
  "30d": "1d",
};

const GROUP_BY_OPTIONS = [
  { value: "job", label: "By job" },
  { value: "status", label: "By status" },
];

/** Pivot per-series points into rows keyed by timestamp for the stacked bar chart. */
function toStackedData(series: MetricSeries[]): Array<Record<string, string | number>> {
  const byTs = new Map<string, Record<string, string | number>>();
  for (const s of series) {
    for (const point of s.points) {
      const row = byTs.get(point.ts) ?? { ts: point.ts };
      row[s.name] = point.value;
      byTs.set(point.ts, row);
    }
  }
  return Array.from(byTs.values()).sort((a, b) => (String(a.ts) < String(b.ts) ? -1 : 1));
}

export function MetricsPage() {
  const [period, setPeriod] = useState("24h");
  const [groupBy, setGroupBy] = useState("job");

  const { data, isLoading, isError, error } = useMetrics({
    bucket: PERIOD_TO_BUCKET[period],
  });

  const series = useMemo(() => data?.series ?? [], [data]);

  const timeSeries = useMemo(
    () => series.map((s) => ({ name: s.name, points: s.points })),
    [series]
  );

  const stackedData = useMemo(() => toStackedData(series), [series]);
  const stackedSeries = useMemo(
    () => series.map((s) => ({ key: s.name, label: s.name })),
    [series]
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Metrics</h1>
        <div className="flex items-center gap-3">
          <GroupByTabs options={GROUP_BY_OPTIONS} value={groupBy} onChange={setGroupBy} />
          <PeriodPicker value={period} onChange={setPeriod} />
        </div>
      </header>

      {isError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Failed to load metrics: {(error as Error)?.message}
        </div>
      ) : isLoading ? (
        <div className="text-sm text-slate-500">Loading…</div>
      ) : (
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-slate-500">Over time</h2>
            <TimeSeriesChart series={timeSeries} type="line" />
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-slate-500">Stacked by series</h2>
            <StackedBarChart data={stackedData} xKey="ts" series={stackedSeries} />
          </section>
        </div>
      )}
    </div>
  );
}
