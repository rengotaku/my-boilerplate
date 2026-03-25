import { render as rtlRender, type RenderOptions } from "@testing-library/react";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";
import { BrowserRouter } from "react-router-dom";
import type { ReactNode, ReactElement } from "react";

export function createTestApolloClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: "no-cache",
      },
      query: {
        fetchPolicy: "no-cache",
      },
    },
  });
}

interface WrapperProps {
  children: ReactNode;
}

export function TestWrapper({ children }: WrapperProps) {
  const client = createTestApolloClient();

  return (
    <ApolloProvider client={client}>
      <BrowserRouter>{children}</BrowserRouter>
    </ApolloProvider>
  );
}

function render(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return rtlRender(ui, { wrapper: TestWrapper, ...options });
}

export * from "@testing-library/react";
export { render };
