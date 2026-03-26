# Sync Files Documentation

This document lists files that should be kept in sync between `react-spa` and `react-spa-graphql`.

## Sync Strategy

- **react-spa**: REST API variant (base)
- **react-spa-graphql**: GraphQL API variant (derived)

Common infrastructure files should be synced. API-specific implementations are independent.

## Synced Files

### Build & Config

| File | Description |
|------|-------------|
| `vite.config.ts` | Vite build configuration |
| `tsconfig.json` | TypeScript base config |
| `tsconfig.app.json` | App TypeScript config |
| `tsconfig.node.json` | Node TypeScript config |
| `eslint.config.js` | ESLint configuration |
| `.prettierrc` | Prettier configuration |
| `.prettierignore` | Prettier ignore patterns |

### Testing

| File | Description |
|------|-------------|
| `vitest.config.ts` | Vitest configuration |
| `src/test/setup.ts` | Test setup (MSW, Testing Library) |
| `src/test/mocks/server.ts` | MSW server configuration |

### UI & Theme

| File | Description |
|------|-------------|
| `src/theme/index.ts` | MUI theme configuration |
| `src/components/Layout.tsx` | App layout component |

### Pages (Structure Only)

| File | Description |
|------|-------------|
| `src/pages/HomePage.tsx` | Home page |
| `src/pages/NotFoundPage.tsx` | 404 page |

### State Management

| File | Description |
|------|-------------|
| `src/hooks/useUIStore.ts` | UI state (Zustand) |

## NOT Synced (API-Specific)

### react-spa Only

- `src/api/` - REST API client (ky)
- `src/hooks/useUsers.ts` - TanStack Query hooks

### react-spa-graphql Only

- `src/graphql/` - Apollo Client, operations, generated types
- `src/hooks/useUsers.ts` - Apollo hooks
- `src/hooks/useCreateUser.ts` - Create mutation
- `src/hooks/useUpdateUser.ts` - Update mutation
- `src/hooks/useDeleteUser.ts` - Delete mutation
- `src/components/CreateUserForm.tsx` - GraphQL form
- `src/components/EditUserDialog.tsx` - GraphQL dialog
- `codegen.ts` - GraphQL codegen config

## CI Workflow

The `.github/workflows/sync-check.yml` workflow detects drift between synced files:

1. Compares synced files between variants
2. Fails if differences are found
3. Provides diff output for manual review

## Manual Sync Process

When updating synced files:

1. Make changes in `react-spa`
2. Copy to `react-spa-graphql`
3. Run tests in both: `npm test`
4. Commit changes in both directories
