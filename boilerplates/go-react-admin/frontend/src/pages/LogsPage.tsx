import { useMemo, useState } from "react";
import { HStack } from "@astryxdesign/core/HStack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { MetricsFilters } from "@/components/admin/metrics-filters";
import { LogViewer } from "@/components/LogViewer";
import { useRuns, useRun } from "@/hooks/useRuns";

const LEVEL_OPTIONS = [
  { value: "", label: "All" },
  { value: "debug", label: "Debug" },
  { value: "info", label: "Info" },
  { value: "warn", label: "Warn" },
  { value: "error", label: "Error" },
];

export function LogsPage() {
  const { data: runsData, isLoading: runsLoading } = useRuns({
    page: 1,
    pageSize: 50,
  });

  const runs = useMemo(() => runsData?.items ?? [], [runsData]);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [level, setLevel] = useState("");

  // Default to the most recent run once the list arrives.
  const activeRunId = selectedRunId ?? runs[0]?.id ?? null;

  const { data: runDetail, isLoading: detailLoading } = useRun(activeRunId ?? undefined);

  const filteredLogs = useMemo(() => {
    const logs = runDetail?.logs ?? [];
    if (!level) return logs;
    return logs.filter((l) => l.level.toLowerCase() === level);
  }, [runDetail, level]);

  const runOptions = useMemo(
    () => [
      { value: "", label: "Select run…" },
      ...runs.map((r) => ({
        value: String(r.id),
        label: `#${r.id} · ${r.jobName}`,
      })),
    ],
    [runs]
  );

  return (
    <VStack gap={4}>
      <HStack justify="between" align="end" gap={3} wrap="wrap">
        <Heading level={1}>Logs</Heading>
        <MetricsFilters
          fields={[
            {
              name: "run",
              label: "Run",
              options: runOptions,
              value: activeRunId != null ? String(activeRunId) : "",
            },
            {
              name: "level",
              label: "Level",
              options: LEVEL_OPTIONS,
              value: level,
            },
          ]}
          onChange={(name, value) => {
            if (name === "run") {
              setSelectedRunId(value ? Number(value) : null);
            } else {
              setLevel(value);
            }
          }}
        />
      </HStack>

      {runsLoading ? (
        <Text type="supporting">Loading runs…</Text>
      ) : activeRunId == null ? (
        <Text type="supporting">No runs available.</Text>
      ) : (
        <LogViewer
          logs={filteredLogs}
          emptyMessage={detailLoading ? "Loading logs…" : "No logs"}
        />
      )}
    </VStack>
  );
}
