import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { jobsApi } from "@/api/jobs";
import type { JobInput } from "@/types/job";

export function useJobs() {
  return useQuery({
    queryKey: ["jobs"],
    queryFn: () => jobsApi.list(),
  });
}

export function useJob(id: number | undefined) {
  return useQuery({
    queryKey: ["job", id],
    queryFn: () => jobsApi.get(id as number),
    enabled: id != null && !Number.isNaN(id),
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: JobInput) => jobsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: JobInput }) =>
      jobsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => jobsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}
