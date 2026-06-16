import { useQuery } from "@tanstack/react-query";
import { runsApi, type ListRunsParams } from "@/api/runs";

export function useRuns(params: ListRunsParams = {}) {
  return useQuery({
    queryKey: ["runs", params],
    queryFn: () => runsApi.list(params),
  });
}

export function useRun(id: number | undefined) {
  return useQuery({
    queryKey: ["run", id],
    queryFn: () => runsApi.get(id as number),
    enabled: id != null && !Number.isNaN(id),
  });
}
