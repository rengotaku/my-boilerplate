import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Grid } from "@astryxdesign/core/Grid";
import { HStack } from "@astryxdesign/core/HStack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { useJob, useDeleteJob } from "@/hooks/useJobs";
import { useRuns } from "@/hooks/useRuns";
import { useTimeZone } from "@/hooks/useConfig";
import { statusTone, formatDuration } from "@/lib/status";
import { formatInstant } from "@/lib/datetime";
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
    return <Text type="supporting">Loading…</Text>;
  }
  if (isError || !data) {
    return (
      <Banner
        status="error"
        title="Failed to load job"
        description={(error as Error)?.message ?? "not found"}
      />
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
  const tz = useTimeZone();
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
      cell: (row) => formatInstant(row.startedAt, tz),
      title: (row) => formatInstant(row.startedAt, tz),
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
    <VStack gap={6}>
      <HStack justify="between" align="center" gap={3} wrap="wrap">
        <HStack gap={3} align="center" wrap="wrap">
          <Heading level={2}>{job.name}</Heading>
          <StatusBadge
            tone={job.enabled ? "success" : "neutral"}
            label={job.enabled ? "enabled" : "disabled"}
          />
        </HStack>
        <HStack gap={2} align="center">
          {onEdit && (
            <Button label="Edit" variant="secondary" size="sm" onClick={onEdit} />
          )}
          <Button
            label="Delete"
            variant="secondary"
            size="sm"
            onClick={onDelete}
            isLoading={deleteJob.isPending}
          />
        </HStack>
      </HStack>

      <Grid columns={{ minWidth: 140 }} gap={4}>
        <Field label="Kind" value={job.kind} />
        <Field label="Schedule" value={job.schedule} mono />
        <Field label="Runs" value={String(job.runCount)} />
        <Field label="Last run" value={formatInstant(job.lastRunAt, tz)} />
        <Field label="Next run" value={formatInstant(job.nextRunAt, tz)} />
        <Field label="Created" value={formatInstant(job.createdAt, tz)} />
      </Grid>

      <VStack gap={3}>
        <Text weight="semibold">Run history</Text>
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
      </VStack>
    </VStack>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <VStack gap={0.5}>
      <Text type="supporting">{label}</Text>
      {mono ? <Text type="code">{value}</Text> : <Text>{value}</Text>}
    </VStack>
  );
}
