# Go GraphQL API Boilerplate

Go + gqlgen の GraphQL API ボイラープレート。

## Features

- **GraphQL**: [gqlgen](https://github.com/99designs/gqlgen)
- **Playground**: GraphQL Playground at `/`
- **ORM**: [GORM](https://gorm.io/) + SQLite ([glebarez/sqlite](https://github.com/glebarez/sqlite) — pure Go)
- **Migrations**: [Atlas](https://atlasgo.io/)
- **Auth**: [golang-jwt/jwt](https://github.com/golang-jwt/jwt)
- **Config**: [sethvargo/go-envconfig](https://github.com/sethvargo/go-envconfig)
- **Logging**: slog (標準ライブラリ)
- **Testing**: [testify](https://github.com/stretchr/testify)
- **Linter**: [golangci-lint](https://golangci-lint.run/)

## Prerequisites

- [Go](https://go.dev/dl/) 1.21+
- [golangci-lint](https://golangci-lint.run/welcome/install/)
- [Atlas CLI](https://atlasgo.io/getting-started) (optional, for migrations)
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
# Install dependencies + air (once)
make install

# Run with hot reload
make run
```

Air watches `.go` files and automatically rebuilds/restarts the server on changes.

## Commands

```bash
make help           # Show all commands
make install        # Download dependencies and dev tools (air)
make build          # Build the binary
make run            # Run the server with hot reload (air)
make run-bare       # Run the server without hot reload
make lint           # Run golangci-lint
make test           # Run tests
make test-cov       # Run tests with coverage
make check          # Run lint + test
make ci             # Run lint + test-cov
make generate       # Generate GraphQL code
make migrate-diff   # Generate a new migration (requires atlas CLI)
make migrate-apply  # Apply pending migrations (requires atlas CLI)
make migrate-hash   # Rehash the migration directory (requires atlas CLI)
make clean          # Remove build artifacts
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
├── atlasgen/
│   └── main.go               # Atlas schema generator
├── cmd/
│   └── server/
│       └── main.go           # Entry point
├── internal/
│   ├── graph/
│   │   ├── generated/        # gqlgen generated code
│   │   ├── model/            # GraphQL models (GORM)
│   │   └── resolver/         # Resolvers
│   ├── middleware/           # JWT auth middleware
│   ├── service/              # Business logic
│   ├── repository/           # Data access (GORM)
│   └── testutil/             # Test helpers
├── migrations/               # Atlas SQL migrations
├── api/
│   └── schema.graphql        # GraphQL schema
├── atlas.hcl                 # Atlas config
├── gqlgen.yml                # gqlgen config
├── go.mod
├── Makefile
├── Dockerfile
└── README.md
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Server port |
| `DATABASE_DSN` | `app.db` | SQLite database path |
| `JWT_SECRET` | `change-me-in-production` | JWT signing secret |
| `JWT_EXPIRY` | `24h` | JWT token expiry |
| `SHUTDOWN_TIMEOUT` | `10s` | Graceful shutdown timeout |
| `APP_ENV` | `` | Set to `production` for JSON logging |
| `LOG_LEVEL` | `INFO` | Log level (DEBUG, INFO, WARN, ERROR) |

## Docker

```bash
# Build image
docker build -t go-graphql-api .

# Run container
docker run -p 8081:8081 go-graphql-api
```

## Customization

1. Modify `api/schema.graphql` for your schema
2. Run `make generate` to regenerate code
3. Implement resolvers in `internal/graph/resolver/`
4. Add business logic in `internal/service/`
5. Implement persistence in `internal/repository/`
6. Run `make migrate-diff` to generate migrations

## License

MIT
