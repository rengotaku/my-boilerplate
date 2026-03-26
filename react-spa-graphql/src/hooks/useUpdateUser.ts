import {
  useUpdateUserMutation,
  type UpdateUserMutation,
  type UpdateUserInput,
} from "@/graphql/generated/graphql";

interface UseUpdateUserOptions {
  onCompleted?: (data: UpdateUserMutation) => void;
}

export function useUpdateUser(options?: UseUpdateUserOptions) {
  const [updateUserMutation, { loading, error }] = useUpdateUserMutation({
    refetchQueries: ["GetUsers"],
    onCompleted: options?.onCompleted,
  });

  const updateUser = async (id: string, input: UpdateUserInput) => {
    return updateUserMutation({ variables: { id, input } });
  };

  return { updateUser, loading, error };
}
