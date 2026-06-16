import { apiClient } from "./client";
import { runsResponseSchema, runDetailResponseSchema } from "@/schemas/run";
import type { RunsResponse, RunDetailResponse, RunStatus } from "@/types/run";

export interface ListRunsParams {
  page?: number;
  pageSize?: number;
  status?: RunStatus | "";
  jobId?: number;
}

export const runsApi = {
  list: async (params: ListRunsParams = {}): Promise<RunsResponse> => {
    const searchParams = new URLSearchParams();
    if (params.page != null) searchParams.set("page", String(params.page));
    if (params.pageSize != null) searchParams.set("page_size", String(params.pageSize));
    if (params.status) searchParams.set("status", params.status);
    if (params.jobId != null) searchParams.set("job_id", String(params.jobId));

    const json = await apiClient.get("api/runs", { searchParams }).json();
    return runsResponseSchema.parse(json);
  },

  get: async (id: number): Promise<RunDetailResponse> => {
    const json = await apiClient.get(`api/runs/${id}`).json();
    return runDetailResponseSchema.parse(json);
  },
};
