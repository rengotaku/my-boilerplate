import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { HStack } from "@astryxdesign/core/HStack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { KindBadge } from "@/components/admin/kind-badge";
import { Drawer } from "@/components/admin/drawer";
import { JobDetailContent } from "@/components/JobDetailContent";
import { useJobs } from "@/hooks/useJobs";
import { useTimeZone } from "@/hooks/useConfig";
import { formatInstant } from "@/lib/datetime";
import type { JobView } from "@/types/job";

const ENABLED_OPTIONS = [
  { value: "true", label: "Enabled" },
  { value: "false", label: "Disabled" },
];

export function JobsPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useJobs();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const tz = useTimeZone();

  const columns: DataTableColumn<JobView>[] = [
    {
      key: "name",
      header: "Name",
      width: "14rem",
      cell: (row) => row.name,
      title: (row) => row.name,
      filter: { kind: "text", accessor: (row) => row.name, placeholder: "name…" },
    },
    {
      key: "kind",
      header: "Kind",
      width: "9rem",
      cell: (row) => <KindBadge label={row.kind} />,
      filter: { kind: "text", accessor: (row) => row.kind, placeholder: "kind…" },
    },
    {
      key: "schedule",
      header: "Schedule",
      width: "12rem",
      cell: (row) => <Text type="code">{row.schedule}</Text>,
      title: (row) => row.schedule,
    },
    {
      key: "enabled",
      header: "Enabled",
      width: "9rem",
      cell: (row) => (
        <StatusBadge
          tone={row.enabled ? "success" : "neutral"}
          label={row.enabled ? "enabled" : "disabled"}
        />
      ),
      filter: {
        kind: "select",
        accessor: (row) => String(row.enabled),
        options: ENABLED_OPTIONS,
      },
    },
    {
      key: "lastRunAt",
      header: "Last run",
      cell: (row) => formatInstant(row.lastRunAt, tz),
      title: (row) => formatInstant(row.lastRunAt, tz),
    },
    {
      key: "nextRunAt",
      header: "Next run",
      cell: (row) => formatInstant(row.nextRunAt, tz),
      title: (row) => formatInstant(row.nextRunAt, tz),
    },
    {
      key: "runCount",
      header: "Runs",
      width: "5rem",
      align: "right",
      cell: (row) => row.runCount,
    },
  ];

  return (
    <VStack gap={4}>
      <HStack justify="between" align="center" gap={3} wrap="wrap">
        <Heading level={1}>Jobs</Heading>
        <Button label="New job" href="/jobs/new" icon={<Plus />} variant="primary" />
      </HStack>

      {isError ? (
        <Banner
          status="error"
          title="Failed to load jobs"
          description={(error as Error)?.message}
        />
      ) : (
        <DataTable<JobView>
          columns={columns}
          rows={data?.items ?? []}
          getRowKey={(row) => row.id}
          onRowClick={(row) => setSelectedId(row.id)}
          emptyMessage={isLoading ? "Loading…" : "No jobs"}
        />
      )}

      <Drawer
        open={selectedId !== null}
        onClose={() => setSelectedId(null)}
        title={selectedId !== null ? "Job detail" : ""}
      >
        {selectedId !== null && (
          <JobDetailContent
            jobId={selectedId}
            onEdit={() => navigate(`/jobs/${selectedId}/edit`)}
            onDeleted={() => setSelectedId(null)}
          />
        )}
      </Drawer>
    </VStack>
  );
}
