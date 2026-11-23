import { render as rtlRender, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { Theme } from "@astryxdesign/core/theme";
import { LinkProvider } from "@astryxdesign/core/Link";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import type { ReactNode, ReactElement } from "react";

import { RouterLink } from "@/components/RouterLink";

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
        <MemoryRouter initialEntries={initialEntries}>
          <Theme theme={neutralTheme} mode="light">
            <LinkProvider component={RouterLink}>{children}</LinkProvider>
          </Theme>
        </MemoryRouter>
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
