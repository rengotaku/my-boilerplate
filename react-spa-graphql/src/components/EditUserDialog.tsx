import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
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
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>

        <div className="py-2">
          {mutationError && (
            <Alert variant="destructive" className="mb-4">
              {mutationError}
            </Alert>
          )}

          {showDeleteConfirm ? (
            <Alert className="py-4">本当に削除しますか？この操作は取り消せません。</Alert>
          ) : (
            <form
              id="edit-user-form"
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1">
                <label htmlFor="edit-name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="edit-name"
                  {...register("name")}
                  aria-describedby={errors.name ? "edit-name-error" : undefined}
                  disabled={loading}
                />
                {errors.name && (
                  <p id="edit-name-error" className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="edit-email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="edit-email"
                  {...register("email")}
                  aria-describedby={errors.email ? "edit-email-error" : undefined}
                  disabled={loading}
                />
                {errors.email && (
                  <p id="edit-email-error" className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </form>
          )}
        </div>

        <DialogFooter className="gap-2">
          {showDeleteConfirm ? (
            <>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                Confirm
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
              >
                Delete
              </Button>
              <div className="flex-1" />
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" form="edit-user-form" disabled={loading}>
                Save
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
