import { render as rtlRender, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
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

interface WrapperProps {
  children: ReactNode;
}

/**
 * Astryx needs its Theme and link contexts. Use this alone when the component
 * under test brings its own router (App renders BrowserRouter internally).
 */
export function AstryxWrapper({ children }: WrapperProps) {
  return (
    <Theme theme={neutralTheme} mode="light">
      <LinkProvider component={RouterLink}>{children}</LinkProvider>
    </Theme>
  );
}

export function TestWrapper({ children }: WrapperProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AstryxWrapper>{children}</AstryxWrapper>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function render(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return rtlRender(ui, { wrapper: TestWrapper, ...options });
}

export * from "@testing-library/react";
export { render };
