import { StatusBadge } from "@/components/admin/status-badge";
import { PhaseTimeline } from "@/components/admin/phase-timeline";
import { EventTimeline } from "@/components/admin/event-timeline";
import { LogViewer } from "@/components/LogViewer";
import { useRun } from "@/hooks/useRuns";
import { statusTone, formatDuration } from "@/lib/status";
import type { AdminEvent, Phase } from "@/types/run";

// RunDetailContent renders a run's detail (summary + timelines + logs). It is
// used both inside the half-overlay drawer (from the Runs list) and by the
// full-page route /runs/:id, so it owns no page chrome (no back link).
export function RunDetailContent({ runId }: { runId: number }) {
  const { data, isLoading, isError, error } = useRun(runId);

  if (isLoading) {
    return <div className="text-sm text-slate-500">Loading…</div>;
  }
  if (isError || !data) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        Failed to load run: {(error as Error)?.message ?? "not found"}
      </div>
    );
  }

  const { run, phases, events, logs } = data;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">
          Run #{run.id} &middot; {run.jobName}
        </h2>
        <StatusBadge tone={statusTone(run.status)} label={run.status} />
        <span className="text-sm text-slate-500">
          {formatDuration(run.startedAt, run.finishedAt)}
        </span>
      </header>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-slate-500">Phases</h3>
        <PhaseTimeline<Phase>
          phases={phases}
          getKey={(p) => p.id}
          getName={(p) => p.name}
          getTone={(p) => statusTone(p.status)}
          getDuration={(p) => formatDuration(p.startedAt, p.finishedAt)}
        />
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-slate-500">Events</h3>
        <EventTimeline<AdminEvent>
          items={events}
          getKey={(e, i) => `${e.ts}-${i}`}
          getTimestamp={(e) => e.ts}
          getTitle={(e) => `${e.type} · ${e.phase}`}
          getTone={(e) => statusTone(e.status)}
        />
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-slate-500">Logs</h3>
        <LogViewer logs={logs} />
      </section>
    </div>
  );
}
