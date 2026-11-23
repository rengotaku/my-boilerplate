import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { HStack } from "@astryxdesign/core/HStack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";
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
    return <Text type="supporting">Loading…</Text>;
  }
  if (isError || !data) {
    return (
      <VStack gap={4}>
        <Button label="Cancel" href="/jobs" variant="ghost" size="sm" />
        <Banner
          status="error"
          title="Failed to load job"
          description={(error as Error)?.message ?? "not found"}
        />
      </VStack>
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

  const onSubmit = (e: FormEvent) => {
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
    <VStack gap={6} maxWidth={640}>
      <Heading level={1}>{mode === "edit" ? "Edit job" : "New job"}</Heading>

      {serverError && <Banner status="error" title={serverError} />}

      <form onSubmit={onSubmit}>
        <VStack gap={4}>
          <TextInput
            label="Name"
            value={name}
            onChange={setName}
            isRequired
            width="100%"
          />

          <TextInput
            label="Kind"
            value={kind}
            onChange={setKind}
            placeholder="task"
            width="100%"
          />

          <VStack gap={1}>
            <TextInput
              label="Schedule"
              value={schedule}
              onChange={setSchedule}
              isRequired
              width="100%"
            />
            <Text type="supporting">Cron spec, e.g. @every 20s, 0 2 * * *, @hourly.</Text>
          </VStack>

          <CheckboxInput
            label="Enabled"
            value={enabled}
            onChange={(checked) => setEnabled(checked)}
          />

          <HStack gap={3} align="center">
            <Button
              type="submit"
              label="Save"
              variant="primary"
              isLoading={mutation.isPending}
            />
            <Button label="Cancel" href="/jobs" variant="ghost" />
          </HStack>
        </VStack>
      </form>
    </VStack>
  );
}
