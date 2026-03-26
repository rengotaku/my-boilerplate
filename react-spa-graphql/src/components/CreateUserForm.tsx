import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
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
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ display: "flex", gap: 2, mb: 3, alignItems: "flex-start" }}
    >
      <TextField
        {...register("name")}
        label="Name"
        size="small"
        error={!!errors.name}
        helperText={errors.name?.message}
      />
      <TextField
        {...register("email")}
        label="Email"
        size="small"
        error={!!errors.email}
        helperText={errors.email?.message}
      />
      <Button type="submit" variant="contained" disabled={loading}>
        Create
      </Button>
      {mutationError && (
        <Alert severity="error" sx={{ py: 0 }}>
          {mutationError}
        </Alert>
      )}
    </Box>
  );
}
