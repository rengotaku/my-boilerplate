import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { configApi } from "@/api/config";
import type { UpdateConfigInput } from "@/types/run";

export function useConfig() {
  return useQuery({
    queryKey: ["config"],
    queryFn: () => configApi.get(),
  });
}

// useTimeZone returns the configured display time zone (Config → time_zone),
// defaulting to Asia/Tokyo (JST) before config loads or if unset.
export function useTimeZone(): string {
  const { data } = useConfig();
  return data?.items.find((i) => i.key === "time_zone")?.value || "Asia/Tokyo";
}

// useUpdateConfig persists edited toml settings (applied on restart).
export function useUpdateConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateConfigInput) => configApi.update(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config"] });
    },
  });
}

// useRestart triggers a server restart so saved toml values take effect.
export function useRestart() {
  return useMutation({
    mutationFn: () => configApi.restart(),
  });
}
