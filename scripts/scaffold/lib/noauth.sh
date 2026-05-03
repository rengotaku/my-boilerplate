#!/usr/bin/env bash
# No-auth transformation.
#
# Removes authentication-related files and rewrites index barrels, App.tsx,
# Layout.tsx, and client.ts so the scaffolded project compiles without auth.
#
# Usage:
#   apply_noauth <frontend_dir>
#
# <frontend_dir> is the root of the React source tree:
#   - go-react-spa:  $dest/frontend
#   - react-spa:     $dest

apply_noauth() {
  local fdir="$1"

  info "[no-auth] Removing auth files..."
  rm -f \
    "$fdir/src/api/auth.ts" \
    "$fdir/src/api/users.ts" \
    "$fdir/src/api/users.test.ts" \
    "$fdir/src/api/client.test.ts" \
    "$fdir/src/hooks/useAuthStore.ts" \
    "$fdir/src/hooks/useUsers.ts" \
    "$fdir/src/hooks/useUsers.test.tsx" \
    "$fdir/src/schemas/auth.ts" \
    "$fdir/src/schemas/user.ts" \
    "$fdir/src/types/auth.ts" \
    "$fdir/src/types/user.ts" \
    "$fdir/src/pages/LoginPage.tsx" \
    "$fdir/src/pages/LoginPage.test.tsx" \
    "$fdir/src/pages/UsersPage.tsx" \
    "$fdir/src/pages/UsersPage.test.tsx"

  info "[no-auth] Rewriting index files and core modules..."

  cat > "$fdir/src/api/index.ts" << 'NOAUTH_EOF'
export { apiClient } from "./client";
NOAUTH_EOF

  cat > "$fdir/src/api/client.ts" << 'NOAUTH_EOF'
import ky from "ky";
import { logger } from "../lib/logger";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export const apiClient = ky.create({
  prefixUrl: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  hooks: {
    beforeError: [
      async (error) => {
        const { response } = error;
        if (response) {
          try {
            const body = await response.json();
            const message =
              (body as { message?: string; error?: string }).message ||
              (body as { error?: string }).error ||
              error.message;
            logger.error(`API ${response.url} failed: ${response.status}`, message);
            error.message = message;
          } catch {
            logger.warn(`Failed to parse error response: ${response.url}`);
          }
        } else {
          logger.error("Network request failed", error.message);
        }
        return error;
      },
    ],
  },
});
NOAUTH_EOF

  cat > "$fdir/src/hooks/index.ts" << 'NOAUTH_EOF'
export { useUIStore } from "./useUIStore";
NOAUTH_EOF

  cat > "$fdir/src/schemas/index.ts" << 'NOAUTH_EOF'
NOAUTH_EOF

  cat > "$fdir/src/types/index.ts" << 'NOAUTH_EOF'
NOAUTH_EOF

  cat > "$fdir/src/pages/index.ts" << 'NOAUTH_EOF'
export { HomePage } from "./HomePage";
export { NotFoundPage } from "./NotFoundPage";
NOAUTH_EOF

  cat > "$fdir/src/components/Layout.tsx" << 'NOAUTH_EOF'
import { Outlet, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-primary-foreground/15 text-primary-foreground"
      : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
  );

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="bg-primary text-primary-foreground shadow">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
          <span className="mr-6 text-lg font-semibold">React SPA</span>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
NOAUTH_EOF

  cat > "$fdir/src/components/Layout.test.tsx" << 'NOAUTH_EOF'
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { Layout } from "./Layout";

describe("Layout", () => {
  it("renders navigation links", () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
  });

  it("renders header and main sections", () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});
NOAUTH_EOF

  cat > "$fdir/src/App.tsx" << 'NOAUTH_EOF'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components";
import { HomePage, NotFoundPage } from "@/pages";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
NOAUTH_EOF

  cat > "$fdir/src/App.test.tsx" << 'NOAUTH_EOF'
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders home page by default", () => {
    render(<App />);
    expect(screen.getByText("React SPA Boilerplate")).toBeInTheDocument();
  });

  it("shows navigation links", () => {
    render(<App />);
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
  });
});
NOAUTH_EOF

  info "[no-auth] Done."
}
