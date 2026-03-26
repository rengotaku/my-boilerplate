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
];
