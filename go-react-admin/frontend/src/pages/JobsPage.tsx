import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { KindBadge } from "@/components/admin/kind-badge";
import { Button } from "@/components/ui/button";
import { useJobs, useDeleteJob } from "@/hooks/useJobs";
import type { JobView } from "@/types/job";

export function JobsPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useJobs();
  const deleteJob = useDeleteJob();

  const onDelete = (job: JobView) => {
    if (!window.confirm(`Delete job "${job.name}"?`)) return;
    deleteJob.mutate(job.id);
  };

  const columns = [
    { header: "Name", cell: (row: JobView) => row.name },
    {
      header: "Kind",
      cell: (row: JobView) => <KindBadge label={row.kind} />,
    },
    {
      header: "Schedule",
      cell: (row: JobView) => <span className="font-mono text-xs">{row.schedule}</span>,
    },
    {
      header: "Enabled",
      cell: (row: JobView) => (
        <StatusBadge
          tone={row.enabled ? "success" : "neutral"}
          label={row.enabled ? "enabled" : "disabled"}
        />
      ),
    },
    { header: "Last run", cell: (row: JobView) => row.lastRunAt ?? "—" },
    { header: "Next run", cell: (row: JobView) => row.nextRunAt ?? "—" },
    {
      header: "Runs",
      cell: (row: JobView) => row.runCount,
      align: "right" as const,
    },
    {
      header: "",
      cell: (row: JobView) => (
        <div
          className="flex items-center justify-end gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Button asChild variant="outline" size="sm">
            <Link to={`/jobs/${row.id}/edit`}>Edit</Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(row)}
            disabled={deleteJob.isPending}
          >
            Delete
          </Button>
        </div>
      ),
      align: "right" as const,
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
          onRowClick={(row) => navigate(`/jobs/${row.id}`)}
          emptyMessage={isLoading ? "Loading…" : "No jobs"}
        />
      )}
    </div>
  );
}
