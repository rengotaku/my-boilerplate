import { useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    <div>
      <h1 className="text-3xl font-bold mb-6">Users</h1>

      <CreateUserForm />

      {loading && (
        <div className="flex justify-center mt-8">
          <Loader2
            className="h-8 w-8 animate-spin"
            role="progressbar"
            aria-label="Loading"
          />
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          エラー: {error.message}
        </Alert>
      )}

      {!loading && !error && users && users.length === 0 && (
        <p className="text-muted-foreground">ユーザーがいません</p>
      )}

      {!loading && !error && users && users.length > 0 && (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="edit"
                      onClick={() =>
                        setEditingUser({
                          id: user.id,
                          name: user.name,
                          email: user.email,
                        })
                      }
                    >
                      <Pencil />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {editingUser && (
        <EditUserDialog
          open={true}
          user={editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}
