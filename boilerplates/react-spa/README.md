# React SPA Boilerplate

A minimal React SPA (Single Page Application) boilerplate for development.

## Tech Stack

| Category | Technology |
|----------|------------|
| Build | Vite |
| Language | TypeScript |
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
├── components/    # UI components
├── hooks/         # Custom hooks (React Query, Zustand)
├── pages/         # Page components
├── test/          # Test utilities
├── types/         # TypeScript types
├── App.tsx        # App entry with routing
└── main.tsx       # React entry point
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
