import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import { useUsers } from "@/hooks";
import { CreateUserForm, EditUserDialog } from "@/components";

export function UsersPage() {
  const { users, loading, error } = useUsers();
  const [editingUser, setEditingUser] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Users
      </Typography>

      <CreateUserForm />

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          エラー: {error.message}
        </Alert>
      )}

      {!loading && !error && users && users.length === 0 && (
        <Typography color="text.secondary">ユーザーがいません</Typography>
      )}

      {!loading && !error && users && users.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() =>
                        setEditingUser({
                          id: user.id,
                          name: user.name,
                          email: user.email,
                        })
                      }
                      aria-label="edit"
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {editingUser && (
        <EditUserDialog
          open={true}
          user={editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </Box>
  );
}
