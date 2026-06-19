# go-react-spa-noauth

Alias for `go-react-spa` with authentication removed automatically at scaffold time.

JWT auth, login page, auth store, and related TypeScript files are stripped from the frontend.
The resulting project is a Go server with an embedded React SPA that has no authentication layer.

## Usage

```bash
curl -sSL https://raw.githubusercontent.com/rengotaku/my-boilerplate/main/scripts/download.sh \
  | sh -s -- go-react-spa-noauth ~/projects/my-app
```

Equivalent to:

```bash
curl -sSL https://raw.githubusercontent.com/rengotaku/my-boilerplate/main/scripts/download.sh \
  | sh -s -- go-react-spa ~/projects/my-app --no-auth
```

## What gets removed

| Removed files | References cleaned up |
|---|---|
| `src/api/auth.ts`, `users.ts`, `users.test.ts` | `src/api/index.ts` re-exports |
| `src/api/client.test.ts` | auth-specific test cases |
| `src/hooks/useAuthStore.ts`, `useUsers.ts`, `useUsers.test.tsx` | `src/hooks/index.ts` re-exports |
| `src/schemas/auth.ts`, `user.ts` | `src/schemas/index.ts` exports |
| `src/types/auth.ts`, `user.ts` | `src/types/index.ts` exports |
| `src/pages/LoginPage.tsx`, `LoginPage.test.tsx` | `src/pages/index.ts`, `App.tsx` routes |
| `src/pages/UsersPage.tsx`, `UsersPage.test.tsx` | `App.tsx` routes |

`Layout.tsx`, `App.tsx`, `App.test.tsx`, and `Layout.test.tsx` are rewritten to remove auth UI.
`src/api/client.ts` is rewritten to remove Bearer-token and 401-redirect logic.
