import { useState } from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { Heading } from "@astryxdesign/core/Heading";
import { VStack } from "@astryxdesign/core/VStack";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { Drawer } from "@/components/admin/drawer";
import { RunDetailContent } from "@/components/RunDetailContent";
import { useRuns } from "@/hooks/useRuns";
import { useTimeZone } from "@/hooks/useConfig";
import { statusTone, formatDuration } from "@/lib/status";
import { formatInstant } from "@/lib/datetime";
import type { Run } from "@/types/run";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "queued", label: "Queued" },
  { value: "running", label: "Running" },
  { value: "succeeded", label: "Succeeded" },
  { value: "failed", label: "Failed" },
];

export function RunsPage() {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const tz = useTimeZone();

  const { data, isLoading, isError, error } = useRuns({ page, pageSize: PAGE_SIZE });

  const columns: DataTableColumn<Run>[] = [
    { key: "id", header: "ID", width: "5rem", align: "right", cell: (row) => row.id },
    {
      key: "jobName",
      header: "Job",
      width: "14rem",
      cell: (row) => row.jobName,
      title: (row) => row.jobName,
      filter: { kind: "text", accessor: (row) => row.jobName, placeholder: "job…" },
    },
    {
      key: "status",
      header: "Status",
      width: "10rem",
      cell: (row) => <StatusBadge tone={statusTone(row.status)} label={row.status} />,
      filter: { kind: "select", accessor: (row) => row.status, options: STATUS_OPTIONS },
    },
    {
      key: "startedAt",
      header: "Started",
      cell: (row) => formatInstant(row.startedAt, tz),
      title: (row) => formatInstant(row.startedAt, tz),
    },
    {
      key: "duration",
      header: "Duration",
      width: "8rem",
      align: "right",
      cell: (row) => formatDuration(row.startedAt, row.finishedAt),
    },
  ];

  return (
    <VStack gap={4}>
      <Heading level={1}>Runs</Heading>

      {isError ? (
        <Banner
          status="error"
          title="Failed to load runs"
          description={(error as Error)?.message}
        />
      ) : (
        <>
          <DataTable<Run>
            columns={columns}
            rows={data?.items ?? []}
            getRowKey={(row) => row.id}
            onRowClick={(row) => setSelectedId(row.id)}
            emptyMessage={isLoading ? "Loading…" : "No runs"}
          />
          <Pagination
            page={data?.page ?? page}
            pageSize={data?.pageSize ?? PAGE_SIZE}
            total={data?.total ?? 0}
            onPageChange={setPage}
          />
        </>
      )}

      <Drawer
        open={selectedId !== null}
        onClose={() => setSelectedId(null)}
        title="Run detail"
        label={selectedId !== null ? `Run #${selectedId}` : "Run detail"}
      >
        {selectedId !== null && <RunDetailContent runId={selectedId} />}
      </Drawer>
    </VStack>
  );
}
