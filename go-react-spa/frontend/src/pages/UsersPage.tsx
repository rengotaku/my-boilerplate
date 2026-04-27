import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks";
import { userFormSchema, type UserFormData } from "@/schemas";
import type { User } from "@/types";

export function UsersPage() {
  const { data: users, isLoading, error } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [editingUser, setEditingUser] = useState<User | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { name: "", email: "" },
  });

  useEffect(() => {
    if (editingUser) {
      setValue("name", editingUser.name);
      setValue("email", editingUser.email);
    }
  }, [editingUser, setValue]);

  const onSubmit = (data: UserFormData) => {
    if (editingUser) {
      updateUser.mutate(
        { id: editingUser.id, input: data },
        {
          onSuccess: () => {
            setEditingUser(null);
            reset();
          },
        }
      );
    } else {
      createUser.mutate(data, {
        onSuccess: () => {
          reset();
        },
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this user?")) {
      deleteUser.mutate(id);
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    reset();
  };

  if (isLoading) {
    return (
      <div className="mt-8 flex justify-center">
        <Loader2
          className="size-8 animate-spin text-primary"
          aria-label="Loading"
          role="progressbar"
        />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Error: {error.message}</AlertDescription>
      </Alert>
    );
  }

  const mutationError =
    createUser.error?.message || updateUser.error?.message || deleteUser.error?.message;

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Users</h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mb-6 flex flex-wrap items-start gap-3"
      >
        <div className="flex flex-col">
          <label
            htmlFor="user-name"
            className="mb-1 text-xs font-medium text-muted-foreground"
          >
            Name
          </label>
          <Input
            id="user-name"
            {...register("name")}
            aria-invalid={!!errors.name}
            className="w-48"
          />
          {errors.name && (
            <span className="mt-1 text-xs text-destructive">{errors.name.message}</span>
          )}
        </div>
        <div className="flex flex-col">
          <label
            htmlFor="user-email"
            className="mb-1 text-xs font-medium text-muted-foreground"
          >
            Email
          </label>
          <Input
            id="user-email"
            {...register("email")}
            aria-invalid={!!errors.email}
            className="w-64"
          />
          {errors.email && (
            <span className="mt-1 text-xs text-destructive">{errors.email.message}</span>
          )}
        </div>
        <Button type="submit" disabled={createUser.isPending || updateUser.isPending}>
          {editingUser ? "Update" : "Create"}
        </Button>
        {editingUser && (
          <Button type="button" variant="outline" onClick={cancelEdit}>
            Cancel
          </Button>
        )}
      </form>

      {mutationError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>Error: {mutationError}</AlertDescription>
        </Alert>
      )}

      {users && users.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(user)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(user.id)}
                        disabled={deleteUser.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-muted-foreground">No users found.</p>
      )}
    </div>
  );
}
