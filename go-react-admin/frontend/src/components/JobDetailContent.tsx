import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { useJob, useDeleteJob } from "@/hooks/useJobs";
import { useRuns } from "@/hooks/useRuns";
import { statusTone, formatDuration } from "@/lib/status";
import type { JobView } from "@/types/job";
import type { Run } from "@/types/run";

const PAGE_SIZE = 20;

// JobDetailContent renders a job's info + its run history. Used inside the
// drawer (from the Jobs list) and the full-page route /jobs/:id. Run-history
// rows navigate to the full /runs/:id page (avoids nesting drawers).
export function JobDetailContent({
  jobId,
  onEdit,
  onDeleted,
}: {
  jobId: number;
  onEdit?: () => void;
  onDeleted?: () => void;
}) {
  const { data, isLoading, isError, error } = useJob(jobId);

  if (isLoading) {
    return <div className="text-sm text-slate-500">Loading…</div>;
  }
  if (isError || !data) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        Failed to load job: {(error as Error)?.message ?? "not found"}
      </div>
    );
  }

  return <JobBody job={data} onEdit={onEdit} onDeleted={onDeleted} />;
}

function JobBody({
  job,
  onEdit,
  onDeleted,
}: {
  job: JobView;
  onEdit?: () => void;
  onDeleted?: () => void;
}) {
  const navigate = useNavigate();
  const deleteJob = useDeleteJob();
  const [page, setPage] = useState(1);

  const { data: runs, isLoading: runsLoading } = useRuns({
    jobId: job.id,
    page,
    pageSize: PAGE_SIZE,
  });

  const onDelete = () => {
    if (!window.confirm(`Delete job "${job.name}"?`)) return;
    deleteJob.mutate(job.id, { onSuccess: () => onDeleted?.() });
  };

  const columns: DataTableColumn<Run>[] = [
    { key: "id", header: "ID", width: "5rem", align: "right", cell: (row) => row.id },
    {
      key: "status",
      header: "Status",
      width: "9rem",
      cell: (row) => <StatusBadge tone={statusTone(row.status)} label={row.status} />,
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
      width: "7rem",
      align: "right",
      cell: (row) => formatDuration(row.startedAt, row.finishedAt),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold">{job.name}</h2>
          <StatusBadge
            tone={job.enabled ? "success" : "neutral"}
            label={job.enabled ? "enabled" : "disabled"}
          />
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            disabled={deleteJob.isPending}
          >
            Delete
          </Button>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
        <Field label="Kind" value={job.kind} />
        <Field label="Schedule" value={job.schedule} mono />
        <Field label="Runs" value={String(job.runCount)} />
        <Field label="Last run" value={job.lastRunAt ?? "—"} />
        <Field label="Next run" value={job.nextRunAt ?? "—"} />
        <Field label="Created" value={job.createdAt} />
      </dl>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-slate-700">Run history</h3>
        <DataTable<Run>
          columns={columns}
          rows={runs?.items ?? []}
          getRowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/runs/${row.id}`)}
          emptyMessage={runsLoading ? "Loading…" : "No runs yet"}
        />
        <Pagination
          page={runs?.page ?? page}
          pageSize={runs?.pageSize ?? PAGE_SIZE}
          total={runs?.total ?? 0}
          onPageChange={setPage}
        />
      </section>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className={mono ? "font-mono text-xs text-slate-700" : "text-slate-700"}>
        {value}
      </dd>
    </div>
  );
}
