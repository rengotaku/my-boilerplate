# Go GraphQL API Boilerplate

Go + gqlgen の GraphQL API ボイラープレート。

## Features

- **GraphQL**: [gqlgen](https://github.com/99designs/gqlgen)
- **Playground**: GraphQL Playground at `/`
- **Config**: [envconfig](https://github.com/kelseyhightower/envconfig)
- **Logging**: slog (標準ライブラリ)
- **Linter**: [golangci-lint](https://golangci-lint.run/)

## Prerequisites

- [Go](https://go.dev/dl/) 1.21+
- [golangci-lint](https://golangci-lint.run/welcome/install/)
- [Docker](https://docs.docker.com/get-docker/) (optional)

## Quick Start

```bash
# Install dependencies
make install

# Run server
make run

# Open GraphQL Playground
open http://localhost:8080/
```

## Development (Hot Reload)

```bash
# Install Air (once)
go install github.com/air-verse/air@latest

# Run with hot reload
make dev
```

Air will watch `.go` files and automatically rebuild/restart the server on changes.

## Commands

```bash
make help        # Show all commands
make install     # Download dependencies
make build       # Build the binary
make run         # Run the server
make dev         # Run with hot reload (requires air)
make lint        # Run golangci-lint
make test        # Run tests
make test-cov    # Run tests with coverage
make check       # Run lint + test
make ci          # Run lint + test-cov
make generate    # Generate GraphQL code
make clean       # Remove build artifacts
```

## GraphQL Schema

```graphql
type Query {
  users: [User!]!
  user(id: ID!): User
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User
  deleteUser(id: ID!): Boolean!
}

type User {
  id: ID!
  name: String!
  email: String!
  createdAt: String!
  updatedAt: String!
}
```

## Example Queries

```graphql
# Create a user
mutation {
  createUser(input: { name: "John Doe", email: "john@example.com" }) {
    id
    name
    email
  }
}

# List users
query {
  users {
    id
    name
    email
  }
}

# Get a user
query {
  user(id: "user-id") {
    id
    name
    email
  }
}

# Update a user
mutation {
  updateUser(id: "user-id", input: { name: "Jane Doe", email: "jane@example.com" }) {
    id
    name
    email
  }
}

# Delete a user
mutation {
  deleteUser(id: "user-id")
}
```

## Project Structure

```
go-graphql-api/
├── cmd/
│   └── server/
│       └── main.go           # Entry point
├── internal/
│   ├── graph/
│   │   ├── generated/        # gqlgen generated code
│   │   ├── model/            # GraphQL models
│   │   └── resolver/         # Resolvers
│   ├── service/              # Business logic
│   └── repository/           # Data access
├── api/
│   └── schema.graphql        # GraphQL schema
├── gqlgen.yml                # gqlgen config
├── go.mod
├── Makefile
├── .golangci.yml
├── Dockerfile
└── README.md
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 8080 | Server port |
| SHUTDOWN_TIMEOUT | 10s | Graceful shutdown timeout |

## Docker

```bash
# Build image
docker build -t go-graphql-api .

# Run container
docker run -p 8080:8080 go-graphql-api
```

## Customization

1. Modify `api/schema.graphql` for your schema
2. Run `make generate` to regenerate code
3. Implement resolvers in `internal/graph/resolver/`
4. Add business logic in `internal/service/`
5. Implement persistence in `internal/repository/`

## License

MIT
