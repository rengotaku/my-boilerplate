import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/components/admin/data-table";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { MetricsFilters } from "@/components/admin/metrics-filters";
import { useRuns } from "@/hooks/useRuns";
import { statusTone, formatDuration } from "@/lib/status";
import type { Run, RunStatus } from "@/types/run";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "queued", label: "Queued" },
  { value: "running", label: "Running" },
  { value: "succeeded", label: "Succeeded" },
  { value: "failed", label: "Failed" },
];

export function RunsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<RunStatus | "">("");

  const { data, isLoading, isError, error } = useRuns({
    page,
    pageSize: PAGE_SIZE,
    status,
  });

  const columns = [
    { header: "ID", cell: (row: Run) => row.id, align: "right" as const },
    { header: "Job", cell: (row: Run) => row.jobName },
    {
      header: "Status",
      cell: (row: Run) => (
        <StatusBadge tone={statusTone(row.status)} label={row.status} />
      ),
    },
    { header: "Started", cell: (row: Run) => row.startedAt },
    {
      header: "Duration",
      cell: (row: Run) => formatDuration(row.startedAt, row.finishedAt),
      align: "right" as const,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Runs</h1>
        <MetricsFilters
          fields={[
            {
              name: "status",
              label: "Status",
              options: STATUS_OPTIONS,
              value: status,
            },
          ]}
          onChange={(_name, value) => {
            setStatus(value as RunStatus | "");
            setPage(1);
          }}
        />
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
            onRowClick={(row) => navigate(`/runs/${row.id}`)}
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
    </div>
  );
}
