import {
  useDeleteUserMutation,
  type DeleteUserMutation,
} from "@/graphql/generated/graphql";

interface UseDeleteUserOptions {
  onCompleted?: (data: DeleteUserMutation) => void;
}

export function useDeleteUser(options?: UseDeleteUserOptions) {
  const [deleteUserMutation, { loading, error }] = useDeleteUserMutation({
    refetchQueries: ["GetUsers"],
    onCompleted: options?.onCompleted,
  });

  const deleteUser = async (id: string) => {
    return deleteUserMutation({ variables: { id } });
  };

  return { deleteUser, loading, error };
}
