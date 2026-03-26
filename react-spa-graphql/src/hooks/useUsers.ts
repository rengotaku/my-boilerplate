import { useGetUsersQuery } from "@/graphql/generated/graphql";

export function useUsers() {
  const { data, loading, error } = useGetUsersQuery();
  return {
    users: data?.users,
    loading,
    error,
  };
}
