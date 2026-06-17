import { useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { Drawer } from "@/components/admin/drawer";
import { RunDetailContent } from "@/components/RunDetailContent";
import { useRuns } from "@/hooks/useRuns";
import { statusTone, formatDuration } from "@/lib/status";
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
      cell: (row) => row.startedAt,
      title: (row) => row.startedAt,
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
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Runs</h1>
      </header>

      {isError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Failed to load runs: {(error as Error)?.message}
        </div>
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
        title={selectedId !== null ? `Run #${selectedId}` : ""}
      >
        {selectedId !== null && <RunDetailContent runId={selectedId} />}
      </Drawer>
    </div>
  );
}
