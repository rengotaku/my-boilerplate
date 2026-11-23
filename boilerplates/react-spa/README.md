# React SPA Boilerplate

A minimal React SPA (Single Page Application) boilerplate for development.

## Tech Stack

| Category | Technology |
|----------|------------|
| Build | Vite |
| Language | TypeScript |
| Design System | Astryx (`@astryxdesign/core`) |
| Routing | React Router |
| API State | TanStack Query |
| UI State | Zustand |
| HTTP Client | ky |
| Linter | ESLint |
| Formatter | Prettier |
| Testing | Vitest + Testing Library |

## Project Structure

```
src/
├── api/           # API client and endpoints
├── components/    # Layout, router link adapter
├── hooks/         # Custom hooks (React Query, Zustand)
├── pages/         # Page components
├── test/          # Test utilities
├── types/         # TypeScript types
├── App.tsx        # App entry with routing
├── index.css      # System font stack + page column
└── main.tsx       # React entry point (theme, CSS order)
```

## Getting Started

```bash
# Install dependencies
npm install

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
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run astryx` | Run the Astryx CLI (component docs, tokens) |

## Astryx

Astryx is Meta's OSS design system. It is still in beta, so the version is pinned
exactly: `@astryxdesign/core`, `@astryxdesign/theme-neutral` and
`@astryxdesign/cli` are all `0.7.12` (no `^`). Do not bump one without the others.

- **CSS order is meaningful.** `main.tsx` imports `reset.css` → `astryx.css` →
  `theme.css`, then `index.css`. `theme.css` only applies under
  `[data-astryx-theme]`, and `index.html` sets `data-astryx-theme="neutral"` on
  `<html>`.
- **No web fonts.** `theme.css` only names typefaces; `fonts.css` pulls them from
  a CDN. This template keeps a local system stack in `index.css` instead.
- **Look up components, do not guess.** The CLI ships the props and Do / Don't of
  every component:

  ```bash
  npx astryx component --list
  npx astryx search table
  npx astryx component TextInput --dense
  npm run astryx component Table --dense
  ```

- **Links go through react-router.** `src/components/RouterLink.tsx` maps
  Astryx's `href` to react-router's `to`; `main.tsx` hands it to `LinkProvider`,
  so `TopNavItem`, `Button href` and `Link` all navigate client-side.
- **Updating:** bump the three `@astryxdesign/*` versions together, run
  `npm run astryx upgrade --apply`, then check every page in the browser. The
  Astryx CLI version must match `@astryxdesign/core`.

## Environment Variables

Create `.env.local` for local development:

```
VITE_API_BASE_URL=http://localhost:8080
```

## Backend Integration

This SPA talks to a REST API through `src/api/`. Point `VITE_API_BASE_URL` at
your backend; this repository no longer ships a standalone REST API template.

## Notes

- **Development only**: Deployment configuration (Dockerfile, CI/CD deploy) is out of scope
- **No container environment**: Use local Node.js for development
