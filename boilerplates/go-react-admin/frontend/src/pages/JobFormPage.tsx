import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useJob, useCreateJob, useUpdateJob } from "@/hooks/useJobs";
import type { JobInput, JobView } from "@/types/job";

// JobFormPage is the route entry. For /jobs/new it renders the form immediately;
// for /jobs/:id/edit it waits for the job to load, then mounts JobForm with the
// loaded values as initial state (no effect-based seeding).
export function JobFormPage() {
  const params = useParams<{ id: string }>();
  const id = params.id ? Number(params.id) : undefined;

  if (id == null) {
    return <JobForm mode="create" />;
  }
  return <EditJobForm id={id} />;
}

function EditJobForm({ id }: { id: number }) {
  const { data, isLoading, isError, error } = useJob(id);

  if (isLoading) {
    return <div className="text-sm text-slate-500">Loading…</div>;
  }
  if (isError || !data) {
    return (
      <div className="flex flex-col gap-4">
        <CancelLink />
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Failed to load job: {(error as Error)?.message ?? "not found"}
        </div>
      </div>
    );
  }
  return <JobForm mode="edit" id={id} job={data} />;
}

interface JobFormProps {
  mode: "create" | "edit";
  id?: number;
  job?: JobView;
}

function JobForm({ mode, id, job }: JobFormProps) {
  const navigate = useNavigate();
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();

  const [name, setName] = useState(job?.name ?? "");
  const [kind, setKind] = useState(job?.kind ?? "");
  const [schedule, setSchedule] = useState(job?.schedule ?? "");
  const [enabled, setEnabled] = useState(job?.enabled ?? true);

  const mutation = mode === "edit" ? updateJob : createJob;
  const serverError = mutation.isError ? (mutation.error as Error)?.message : undefined;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input: JobInput = {
      name,
      kind: kind || undefined,
      schedule,
      enabled,
    };
    if (mode === "edit" && id != null) {
      updateJob.mutate({ id, input }, { onSuccess: () => navigate("/jobs") });
    } else {
      createJob.mutate(input, { onSuccess: () => navigate("/jobs") });
    }
  };

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-semibold">
        {mode === "edit" ? "Edit job" : "New job"}
      </h1>

      {serverError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Name</span>
          <input
            aria-label="Name"
            className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-400 focus:outline-none"
            value={name}
            required
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Kind</span>
          <input
            aria-label="Kind"
            className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-400 focus:outline-none"
            value={kind}
            placeholder="task"
            onChange={(e) => setKind(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Schedule</span>
          <input
            aria-label="Schedule"
            className="rounded-md border border-slate-300 px-2 py-1 font-mono text-sm focus:border-indigo-400 focus:outline-none"
            value={schedule}
            required
            onChange={(e) => setSchedule(e.target.value)}
          />
          <span className="text-xs text-slate-400">
            Cron spec, e.g. <span className="font-mono">@every 20s</span>,{" "}
            <span className="font-mono">0 2 * * *</span>,{" "}
            <span className="font-mono">@hourly</span>.
          </span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <span className="text-sm font-medium text-slate-700">Enabled</span>
        </label>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save"}
          </Button>
          <Link to="/jobs" className="text-sm text-slate-500 hover:text-slate-800">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function CancelLink() {
  return (
    <Link to="/jobs" className="text-sm text-slate-500 hover:text-slate-800">
      Cancel
    </Link>
  );
}
