import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
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
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Error: {error.message}</Alert>;
  }

  const mutationError =
    createUser.error?.message || updateUser.error?.message || deleteUser.error?.message;

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Users
      </Typography>

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
        <Button
          type="submit"
          variant="contained"
          disabled={createUser.isPending || updateUser.isPending}
          sx={{ mt: errors.name || errors.email ? 0 : 0 }}
        >
          {editingUser ? "Update" : "Create"}
        </Button>
        {editingUser && (
          <Button variant="outlined" onClick={cancelEdit}>
            Cancel
          </Button>
        )}
      </Box>

      {mutationError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error: {mutationError}
        </Alert>
      )}

      {users && users.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => startEdit(user)} sx={{ mr: 1 }}>
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDelete(user.id)}
                      disabled={deleteUser.isPending}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography color="text.secondary">No users found.</Typography>
      )}
    </Box>
  );
}
