# React SPA Cloudflare

A standalone React SPA boilerplate optimized for Cloudflare Pages deployment.

## Tech Stack

| Category | Technology |
|----------|------------|
| Build | Vite |
| Language | TypeScript |
| Design System | Astryx (`@astryxdesign/core`) |
| Routing | React Router |
| Form | React Hook Form + Zod |
| UI State | Zustand |
| Linter | ESLint |
| Formatter | Prettier |
| Testing | Vitest + Testing Library |
| Logging | consola |
| Deployment | Cloudflare Pages |

## Project Structure

```
src/
├── components/    # Layout, router link adapter
├── pages/         # Page components (Home, About, Greeting, 404)
├── schemas/       # Zod validation schemas
├── test/          # Test utilities
├── router.tsx     # React Router configuration
├── App.tsx        # App entry with providers
├── index.css      # System font stack + page column
└── main.tsx       # React entry point (theme, CSS order)

public/
├── _headers       # Cloudflare security headers
└── _routes.json   # SPA routing configuration
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
  npx astryx search card
  npx astryx component TextInput --dense
  npm run astryx component Card --dense
  ```

- **Links go through react-router.** `src/components/RouterLink.tsx` maps
  Astryx's `href` to react-router's `to`; `main.tsx` hands it to `LinkProvider`,
  so `TopNavItem`, `Button href` and `Link` all navigate client-side.
- **Updating:** bump the three `@astryxdesign/*` versions together, run
  `npm run astryx upgrade --apply`, then check every page in the browser. The
  Astryx CLI version must match `@astryxdesign/core`.

## Deployment

### Prerequisites

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

### Deploy to Production

```bash
make deploy
```

### Deploy Preview

```bash
make deploy-preview
```

### Manual Deployment

```bash
# Build
npm run build

# Deploy
npx wrangler pages deploy dist --project-name=react-spa-cloudflare
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

## Make Targets

| Target | Description |
|--------|-------------|
| `make run` | Start development server |
| `make build` | Build for production |
| `make test` | Run tests |
| `make test-cov` | Run tests with coverage |
| `make ci` | lint + format-check + test-cov + build |
| `make deploy` | Deploy to Cloudflare Pages (production) |
| `make deploy-preview` | Deploy to Cloudflare Pages (preview) |
| `make clean` | Remove build artifacts |

## Cloudflare Pages Configuration

- `wrangler.toml` - Wrangler configuration for Pages deployment
- `public/_routes.json` - SPA routing (all routes served by index.html)
- `public/_headers` - Security headers (X-Frame-Options, CSP, etc.)

## Features

- React 19 with TypeScript
- Client-side routing with React Router
- Astryx design system for components
- Form validation with React Hook Form + Zod
- Optimized for Cloudflare Pages edge deployment
- Security headers pre-configured
- CI/CD ready with GitHub Actions
