import { Banner } from "@astryxdesign/core/Banner";
import { HStack } from "@astryxdesign/core/HStack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { StatusBadge } from "@/components/admin/status-badge";
import { PhaseTimeline } from "@/components/admin/phase-timeline";
import { EventTimeline } from "@/components/admin/event-timeline";
import { LogViewer } from "@/components/LogViewer";
import { useRun } from "@/hooks/useRuns";
import { useTimeZone } from "@/hooks/useConfig";
import { statusTone, formatDuration } from "@/lib/status";
import { formatInstant } from "@/lib/datetime";
import type { AdminEvent, Phase } from "@/types/run";

// RunDetailContent renders a run's detail (summary + timelines + logs). It is
// used both inside the half-overlay drawer (from the Runs list) and by the
// full-page route /runs/:id, so it owns no page chrome (no back link).
export function RunDetailContent({ runId }: { runId: number }) {
  const { data, isLoading, isError, error } = useRun(runId);
  const tz = useTimeZone();

  if (isLoading) {
    return <Text type="supporting">Loading…</Text>;
  }
  if (isError || !data) {
    return (
      <Banner
        status="error"
        title="Failed to load run"
        description={(error as Error)?.message ?? "not found"}
      />
    );
  }

  const { run, phases, events, logs } = data;

  return (
    <VStack gap={6}>
      <HStack gap={3} align="center" wrap="wrap">
        <Heading level={2}>
          Run #{run.id} · {run.jobName}
        </Heading>
        <StatusBadge tone={statusTone(run.status)} label={run.status} />
        <Text type="supporting">{formatDuration(run.startedAt, run.finishedAt)}</Text>
      </HStack>

      <VStack gap={2}>
        <Text weight="medium" color="secondary">
          Phases
        </Text>
        <PhaseTimeline<Phase>
          phases={phases}
          getKey={(p) => p.id}
          getName={(p) => p.name}
          getTone={(p) => statusTone(p.status)}
          getDuration={(p) => formatDuration(p.startedAt, p.finishedAt)}
        />
      </VStack>

      <VStack gap={2}>
        <Text weight="medium" color="secondary">
          Events
        </Text>
        <EventTimeline<AdminEvent>
          items={events}
          getKey={(e, i) => `${e.ts}-${i}`}
          getTimestamp={(e) => formatInstant(e.ts, tz)}
          getTitle={(e) => `${e.type} · ${e.phase}`}
          getTone={(e) => statusTone(e.status)}
        />
      </VStack>

      <VStack gap={2}>
        <Text weight="medium" color="secondary">
          Logs
        </Text>
        <LogViewer logs={logs} timeZone={tz} />
      </VStack>
    </VStack>
  );
}
