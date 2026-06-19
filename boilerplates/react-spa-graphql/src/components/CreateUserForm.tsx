import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useCreateUser } from "@/hooks/useCreateUser";
import { userFormSchema, type UserFormData } from "@/schemas";

interface CreateUserFormProps {
  onSuccess?: () => void;
}

export function CreateUserForm({ onSuccess }: CreateUserFormProps) {
  const [mutationError, setMutationError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { name: "", email: "" },
  });

  const { createUser, loading } = useCreateUser({
    onCompleted: () => {
      reset();
      setMutationError(null);
      onSuccess?.();
    },
  });

  const onSubmit = async (data: UserFormData) => {
    try {
      setMutationError(null);
      await createUser(data);
    } catch (err) {
      if (err instanceof Error) {
        setMutationError(err.message);
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex gap-2 mb-6 items-start flex-wrap"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="create-name" className="text-sm font-medium">
          Name
        </label>
        <Input
          id="create-name"
          {...register("name")}
          aria-describedby={errors.name ? "create-name-error" : undefined}
          disabled={loading}
        />
        {errors.name && (
          <p id="create-name-error" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="create-email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="create-email"
          {...register("email")}
          aria-describedby={errors.email ? "create-email-error" : undefined}
          disabled={loading}
        />
        {errors.email && (
          <p id="create-email-error" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>
      <div className="flex flex-col justify-end">
        <Button type="submit" disabled={loading} className="mt-6">
          Create
        </Button>
      </div>
      {mutationError && (
        <Alert variant="destructive" className="w-full mt-2">
          {mutationError}
        </Alert>
      )}
    </form>
  );
}
