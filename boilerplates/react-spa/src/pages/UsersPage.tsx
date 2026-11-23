import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { HStack } from "@astryxdesign/core/HStack";
import { Heading } from "@astryxdesign/core/Heading";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Table, pixel, proportional, type TableColumn } from "@astryxdesign/core/Table";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";

import { useCreateUser, useDeleteUser, useUpdateUser, useUsers } from "@/hooks";
import {
  userCreateFormSchema,
  userUpdateFormSchema,
  type UserCreateFormData,
  type UserUpdateFormData,
} from "@/schemas";
import type { User } from "@/types";

// Astryx's Table requires rows to satisfy Record<string, unknown>.
type UserRow = User & Record<string, unknown>;

interface CreateFormProps {
  isPending: boolean;
  onSubmit: (data: UserCreateFormData) => void;
}

function CreateUserForm({ isPending, onSubmit }: CreateFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserCreateFormData>({
    resolver: zodResolver(userCreateFormSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit((data) => onSubmit(data))}
      onReset={() => reset()}
    >
      <HStack gap={3} vAlign="start" wrap="wrap">
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <TextInput
              label="Name"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              autoComplete="off"
              width={192}
              status={
                errors.name ? { type: "error", message: errors.name.message } : undefined
              }
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextInput
              label="Email"
              type="email"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              autoComplete="off"
              width={256}
              status={
                errors.email
                  ? { type: "error", message: errors.email.message }
                  : undefined
              }
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <TextInput
              label="Password"
              type="password"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              autoComplete="new-password"
              width={192}
              status={
                errors.password
                  ? { type: "error", message: errors.password.message }
                  : undefined
              }
            />
          )}
        />
        <Button label="Create" type="submit" variant="primary" isLoading={isPending} />
      </HStack>
    </form>
  );
}

interface EditFormProps {
  user: User;
  isPending: boolean;
  onSubmit: (data: UserUpdateFormData) => void;
  onCancel: () => void;
}

function EditUserForm({ user, isPending, onSubmit, onCancel }: EditFormProps) {
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UserUpdateFormData>({
    resolver: zodResolver(userUpdateFormSchema),
    defaultValues: { name: user.name, email: user.email },
  });

  useEffect(() => {
    setValue("name", user.name);
    setValue("email", user.email);
  }, [user, setValue]);

  return (
    <form noValidate onSubmit={handleSubmit((data) => onSubmit(data))}>
      <HStack gap={3} vAlign="start" wrap="wrap">
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <TextInput
              label="Name"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              autoComplete="off"
              width={192}
              status={
                errors.name ? { type: "error", message: errors.name.message } : undefined
              }
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextInput
              label="Email"
              type="email"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              autoComplete="off"
              width={256}
              status={
                errors.email
                  ? { type: "error", message: errors.email.message }
                  : undefined
              }
            />
          )}
        />
        <Button label="Update" type="submit" variant="primary" isLoading={isPending} />
        <Button label="Cancel" type="button" variant="secondary" onClick={onCancel} />
      </HStack>
    </form>
  );
}

export function UsersPage() {
  const { data: users, isLoading, error } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [createFormKey, setCreateFormKey] = useState(0);

  const handleCreate = (data: UserCreateFormData) => {
    createUser.mutate(data, {
      onSuccess: () => {
        setCreateFormKey((k) => k + 1);
      },
    });
  };

  const handleUpdate = (data: UserUpdateFormData) => {
    if (!editingUser) return;
    updateUser.mutate(
      { id: editingUser.id, input: data },
      {
        onSuccess: () => {
          setEditingUser(null);
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this user?")) {
      deleteUser.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <HStack hAlign="center" paddingBlockStart={8}>
        <Spinner />
      </HStack>
    );
  }

  if (error) {
    return <Banner status="error" title={`Error: ${error.message}`} />;
  }

  const mutationError =
    createUser.error?.message || updateUser.error?.message || deleteUser.error?.message;

  const columns: TableColumn<UserRow>[] = [
    { key: "name", header: "Name", width: proportional(1, { minWidth: 160 }) },
    { key: "email", header: "Email", width: proportional(1, { minWidth: 200 }) },
    {
      key: "actions",
      header: "Actions",
      width: pixel(190),
      renderCell: (row) => (
        <HStack gap={1}>
          <Button
            label="Edit"
            size="sm"
            variant="ghost"
            onClick={() => setEditingUser(row as User)}
          />
          <Button
            label="Delete"
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(row.id)}
            isDisabled={deleteUser.isPending}
          />
        </HStack>
      ),
    },
  ];

  return (
    <VStack gap={4}>
      <Heading level={1}>Users</Heading>

      {editingUser ? (
        <EditUserForm
          key={editingUser.id}
          user={editingUser}
          isPending={updateUser.isPending}
          onSubmit={handleUpdate}
          onCancel={() => setEditingUser(null)}
        />
      ) : (
        <CreateUserForm
          key={createFormKey}
          isPending={createUser.isPending}
          onSubmit={handleCreate}
        />
      )}

      {mutationError && <Banner status="error" title={`Error: ${mutationError}`} />}

      {users && users.length > 0 ? (
        <Table
          data={users as UserRow[]}
          columns={columns}
          idKey="id"
          hasHover
          textOverflow="wrap"
        />
      ) : (
        <EmptyState
          headingLevel={2}
          title="No users found."
          description="Create the first user with the form above."
        />
      )}
    </VStack>
  );
}
