import { useQuery } from "@tanstack/react-query";
import { configApi } from "@/api/config";

export function useConfig() {
  return useQuery({
    queryKey: ["config"],
    queryFn: () => configApi.get(),
  });
}
