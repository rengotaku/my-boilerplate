import { useQuery } from "@tanstack/react-query";
import { metricsApi, type AggregateParams } from "@/api/metrics";

export function useMetrics(params: AggregateParams = {}) {
  return useQuery({
    queryKey: ["metrics", params],
    queryFn: () => metricsApi.aggregate(params),
  });
}
