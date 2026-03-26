import {
  useCreateUserMutation,
  type CreateUserMutation,
} from "@/graphql/generated/graphql";

interface UseCreateUserOptions {
  onCompleted?: (data: CreateUserMutation) => void;
}

export function useCreateUser(options?: UseCreateUserOptions) {
  const [createUserMutation, { loading, error }] = useCreateUserMutation({
    refetchQueries: ["GetUsers"],
    onCompleted: options?.onCompleted,
  });

  const createUser = async (input: { name: string; email: string }) => {
    return createUserMutation({ variables: { input } });
  };

  return { createUser, loading, error };
}
