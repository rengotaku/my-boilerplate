import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { KindBadge } from "@/components/admin/kind-badge";
import { Drawer } from "@/components/admin/drawer";
import { Button } from "@/components/ui/button";
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
      cell: (row) => <span className="font-mono text-xs">{row.schedule}</span>,
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
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Jobs</h1>
        <Button asChild>
          <Link to="/jobs/new">
            <Plus className="h-4 w-4" />
            New job
          </Link>
        </Button>
      </header>

      {isError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Failed to load jobs: {(error as Error)?.message}
        </div>
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
    </div>
  );
}
