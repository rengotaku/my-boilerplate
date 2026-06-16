import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import { PhaseTimeline } from "@/components/admin/phase-timeline";
import { EventTimeline } from "@/components/admin/event-timeline";
import { LogViewer } from "@/components/LogViewer";
import { useRun } from "@/hooks/useRuns";
import { statusTone, formatDuration } from "@/lib/status";
import type { AdminEvent, Phase } from "@/types/run";

export function RunDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id ? Number(params.id) : undefined;
  const { data, isLoading, isError, error } = useRun(id);

  if (isLoading) {
    return <div className="text-sm text-slate-500">Loading…</div>;
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Failed to load run: {(error as Error)?.message ?? "not found"}
        </div>
      </div>
    );
  }

  const { run, phases, events, logs } = data;

  return (
    <div className="flex flex-col gap-6">
      <BackLink />

      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">
          Run #{run.id} &middot; {run.jobName}
        </h1>
        <StatusBadge tone={statusTone(run.status)} label={run.status} />
        <span className="text-sm text-slate-500">
          {formatDuration(run.startedAt, run.finishedAt)}
        </span>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-slate-500">Phases</h2>
        <PhaseTimeline<Phase>
          phases={phases}
          getKey={(p) => p.id}
          getName={(p) => p.name}
          getTone={(p) => statusTone(p.status)}
          getDuration={(p) => formatDuration(p.startedAt, p.finishedAt)}
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-slate-500">Events</h2>
        <EventTimeline<AdminEvent>
          items={events}
          getKey={(e, i) => `${e.ts}-${i}`}
          getTimestamp={(e) => e.ts}
          getTitle={(e) => `${e.type} · ${e.phase}`}
          getTone={(e) => statusTone(e.status)}
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-slate-500">Logs</h2>
        <LogViewer logs={logs} />
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/runs"
      className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to runs
    </Link>
  );
}
