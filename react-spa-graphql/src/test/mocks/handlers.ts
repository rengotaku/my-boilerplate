import { graphql, HttpResponse } from "msw";

export const mockUsers = [
  {
    __typename: "User" as const,
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    __typename: "User" as const,
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
  },
];

// MSW v2 GraphQL ハンドラー: GetUsers クエリをモック
export const handlers = [
  graphql.query("GetUsers", () => {
    return HttpResponse.json({
      data: {
        users: mockUsers,
      },
    });
  }),

  // T048: US2 - CreateUser Mutation ハンドラー
  graphql.mutation("CreateUser", ({ variables }) => {
    const { input } = variables as { input: { name: string; email: string } };
    return HttpResponse.json({
      data: {
        createUser: {
          __typename: "User" as const,
          id: "3",
          name: input.name,
          email: input.email,
          createdAt: "2024-03-26T00:00:00Z",
          updatedAt: "2024-03-26T00:00:00Z",
        },
      },
    });
  }),

  // T065: US3 - UpdateUser Mutation ハンドラー
  graphql.mutation("UpdateUser", ({ variables }) => {
    const { id, input } = variables as {
      id: string;
      input: { name?: string; email?: string };
    };
    const existingUser = mockUsers.find((u) => u.id === id);
    return HttpResponse.json({
      data: {
        updateUser: {
          __typename: "User" as const,
          id,
          name: input.name ?? existingUser?.name ?? "Unknown",
          email: input.email ?? existingUser?.email ?? "unknown@example.com",
          createdAt: existingUser?.createdAt ?? "2024-01-01T00:00:00Z",
          updatedAt: "2024-03-26T00:00:00Z",
        },
      },
    });
  }),

  // T065: US3 - DeleteUser Mutation ハンドラー
  graphql.mutation("DeleteUser", () => {
    return HttpResponse.json({
      data: {
        deleteUser: true,
      },
    });
  }),
];
