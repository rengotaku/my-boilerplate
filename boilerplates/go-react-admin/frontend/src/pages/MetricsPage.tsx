import { useMemo, useState } from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { HStack } from "@astryxdesign/core/HStack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
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
    <VStack gap={6}>
      <HStack justify="between" align="center" gap={3} wrap="wrap">
        <Heading level={1}>Metrics</Heading>
        <HStack gap={3} align="center" wrap="wrap">
          <GroupByTabs options={GROUP_BY_OPTIONS} value={groupBy} onChange={setGroupBy} />
          <PeriodPicker value={period} onChange={setPeriod} />
        </HStack>
      </HStack>

      {isError ? (
        <Banner
          status="error"
          title="Failed to load metrics"
          description={(error as Error)?.message}
        />
      ) : isLoading ? (
        <Text type="supporting">Loading…</Text>
      ) : (
        <VStack gap={8}>
          <VStack gap={2}>
            <Text weight="medium" color="secondary">
              Over time
            </Text>
            <TimeSeriesChart series={timeSeries} type="line" />
          </VStack>
          <VStack gap={2}>
            <Text weight="medium" color="secondary">
              Stacked by series
            </Text>
            <StackedBarChart data={stackedData} xKey="ts" series={stackedSeries} />
          </VStack>
        </VStack>
      )}
    </VStack>
  );
}
