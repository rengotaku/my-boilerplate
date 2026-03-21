import { useState } from "react";
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
    createUser.mutate({ name, email }, {
      onSuccess: () => {
        setName("");
        setEmail("");
      },
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !name || !email) return;
    updateUser.mutate({ id: editingUser.id, input: { name, email } }, {
      onSuccess: () => {
        setEditingUser(null);
        setName("");
        setEmail("");
      },
    });
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
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h1>Users</h1>

      <form onSubmit={editingUser ? handleUpdate : handleCreate} style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ marginRight: "0.5rem" }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginRight: "0.5rem" }}
        />
        <button type="submit" disabled={createUser.isPending || updateUser.isPending}>
          {editingUser ? "Update" : "Create"}
        </button>
        {editingUser && (
          <button type="button" onClick={cancelEdit} style={{ marginLeft: "0.5rem" }}>
            Cancel
          </button>
        )}
      </form>

      {(createUser.isError || updateUser.isError || deleteUser.isError) && (
        <div style={{ color: "red", marginBottom: "1rem" }}>
          Error: {createUser.error?.message || updateUser.error?.message || deleteUser.error?.message}
        </div>
      )}

      {users && users.length > 0 ? (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #ccc" }}>Name</th>
              <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #ccc" }}>Email</th>
              <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #ccc" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>{user.name}</td>
                <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>{user.email}</td>
                <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>
                  <button onClick={() => startEdit(user)} style={{ marginRight: "0.5rem" }}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(user.id)} disabled={deleteUser.isPending}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No users found.</p>
      )}
    </div>
  );
}
