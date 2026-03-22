import { useState } from "react";
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
import type { User } from "@/types";

export function UsersPage() {
  const { data: users, isLoading, error } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    createUser.mutate(
      { name, email },
      {
        onSuccess: () => {
          setName("");
          setEmail("");
        },
      }
    );
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !name || !email) return;
    updateUser.mutate(
      { id: editingUser.id, input: { name, email } },
      {
        onSuccess: () => {
          setEditingUser(null);
          setName("");
          setEmail("");
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this user?")) {
      deleteUser.mutate(id);
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setName("");
    setEmail("");
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
        onSubmit={editingUser ? handleUpdate : handleCreate}
        sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}
      >
        <TextField
          label="Name"
          size="small"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="Email"
          type="email"
          size="small"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={createUser.isPending || updateUser.isPending}
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
