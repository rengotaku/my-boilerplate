import { apiClient } from "./client";
import { configResponseSchema } from "@/schemas/run";
import type { ConfigResponse } from "@/types/run";

export const configApi = {
  get: async (): Promise<ConfigResponse> => {
    const json = await apiClient.get("api/config").json();
    return configResponseSchema.parse(json);
  },
};
