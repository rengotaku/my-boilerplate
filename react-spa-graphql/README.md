# React SPA GraphQL Boilerplate

A minimal React SPA with GraphQL integration for development.

## Tech Stack

| Category | Technology |
|----------|------------|
| Build | Vite |
| Language | TypeScript |
| Routing | React Router |
| GraphQL Client | Apollo Client 3.x |
| Code Generation | graphql-codegen |
| UI State | Zustand |
| UI Components | MUI (Material UI) |
| Form Validation | React Hook Form + Zod |
| Linter | ESLint |
| Formatter | Prettier |
| Testing | Vitest + Testing Library + MSW |

## Project Structure

```
src/
├── components/    # UI components (CreateUserForm, EditUserDialog, Layout)
├── graphql/       # GraphQL client and generated types
│   ├── generated/ # Auto-generated types and hooks
│   ├── operations/# GraphQL queries and mutations
│   └── client.ts  # Apollo Client configuration
├── hooks/         # Custom hooks (useUsers, useCreateUser, etc.)
├── pages/         # Page components
├── schemas/       # Zod validation schemas
├── test/          # Test utilities and MSW mocks
├── theme/         # MUI theme configuration
├── types/         # TypeScript types
├── App.tsx        # App entry with routing
└── main.tsx       # React entry point
```

## Getting Started

```bash
# Install dependencies
npm install

# Generate GraphQL types (requires running backend)
npm run codegen

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run codegen` | Generate GraphQL types |
| `npm run codegen:watch` | Watch and regenerate types |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |

## Environment Variables

Create `.env.local` for local development:

```
VITE_GRAPHQL_ENDPOINT=http://localhost:8080/query
```

## Backend Integration

This SPA is designed to work with:
- `go-graphql-api` - GraphQL API backend (port 8080)

Start the backend before running `npm run codegen` to generate types from the schema.

## GraphQL Code Generation

Types and hooks are auto-generated from the backend schema:

```bash
# One-time generation
npm run codegen

# Watch mode (regenerate on file changes)
npm run codegen:watch
```

Generated files in `src/graphql/generated/`:
- `graphql.ts` - TypeScript types and React hooks

## Features

- **User CRUD**: List, create, update, delete users
- **Form Validation**: React Hook Form with Zod schemas
- **Optimistic Updates**: Apollo Client cache management
- **Error Handling**: GraphQL error display
- **Loading States**: Skeleton loading indicators

## Notes

- **Development only**: Deployment configuration is out of scope
- **No container environment**: Use local Node.js for development
- **Synced with react-spa**: Common files are kept in sync
