import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import { useUpdateUser } from "@/hooks/useUpdateUser";
import { useDeleteUser } from "@/hooks/useDeleteUser";
import { userFormSchema, type UserFormData } from "@/schemas";

interface EditUserDialogProps {
  open: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditUserDialog({ open, user, onClose, onSuccess }: EditUserDialogProps) {
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { name: user.name, email: user.email },
    values: { name: user.name, email: user.email },
  });

  const { updateUser, loading: updateLoading } = useUpdateUser({
    onCompleted: () => {
      setMutationError(null);
      onSuccess?.();
      onClose();
    },
  });

  const { deleteUser, loading: deleteLoading } = useDeleteUser({
    onCompleted: () => {
      setMutationError(null);
      setShowDeleteConfirm(false);
      onSuccess?.();
      onClose();
    },
  });

  const loading = updateLoading || deleteLoading;

  const onSubmit = async (data: UserFormData) => {
    try {
      setMutationError(null);
      await updateUser(user.id, data);
    } catch (err) {
      if (err instanceof Error) {
        setMutationError(err.message);
      }
    }
  };

  const handleDelete = async () => {
    try {
      setMutationError(null);
      await deleteUser(user.id);
    } catch (err) {
      if (err instanceof Error) {
        setMutationError(err.message);
      }
    }
  };

  const handleClose = () => {
    if (!loading) {
      setShowDeleteConfirm(false);
      setMutationError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit User</DialogTitle>
      <DialogContent>
        {mutationError && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {mutationError}
          </Alert>
        )}

        {showDeleteConfirm ? (
          <Box sx={{ py: 2 }}>
            <Alert severity="warning">
              本当に削除しますか？この操作は取り消せません。
            </Alert>
          </Box>
        ) : (
          <Box
            component="form"
            id="edit-user-form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
          >
            <TextField
              {...register("name")}
              label="Name"
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message}
              disabled={loading}
            />
            <TextField
              {...register("email")}
              label="Email"
              fullWidth
              error={!!errors.email}
              helperText={errors.email?.message}
              disabled={loading}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {showDeleteConfirm ? (
          <>
            <Button onClick={() => setShowDeleteConfirm(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              color="error"
              variant="contained"
              disabled={loading}
            >
              Confirm
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              color="error"
              disabled={loading}
            >
              Delete
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-user-form"
              variant="contained"
              disabled={loading}
            >
              Save
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
