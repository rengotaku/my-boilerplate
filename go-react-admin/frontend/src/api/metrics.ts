import { apiClient } from "./client";
import { metricsAggregateResponseSchema } from "@/schemas/run";
import type { MetricsAggregateResponse } from "@/types/run";

export interface AggregateParams {
  from?: string;
  to?: string;
  bucket?: string;
}

export const metricsApi = {
  aggregate: async (params: AggregateParams = {}): Promise<MetricsAggregateResponse> => {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set("from", params.from);
    if (params.to) searchParams.set("to", params.to);
    if (params.bucket) searchParams.set("bucket", params.bucket);

    const json = await apiClient.get("api/metrics/aggregate", { searchParams }).json();
    return metricsAggregateResponseSchema.parse(json);
  },
};
