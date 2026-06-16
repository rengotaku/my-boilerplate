import { render as rtlRender, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode, ReactElement } from "react";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface WrapperOptions {
  initialEntries?: string[];
}

function makeWrapper({ initialEntries = ["/"] }: WrapperOptions) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

function render(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & WrapperOptions
) {
  const { initialEntries, ...rtlOptions } = options ?? {};
  return rtlRender(ui, {
    wrapper: makeWrapper({ initialEntries }),
    ...rtlOptions,
  });
}

export * from "@testing-library/react";
export { render };
