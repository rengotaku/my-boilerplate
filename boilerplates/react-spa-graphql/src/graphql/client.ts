import { ApolloClient, InMemoryCache, HttpLink, from } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { logger } from "../lib/logger";

const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      logger.error(`GraphQL ${operation.operationName} failed:`, err.message, err.path);
    }
  }
  if (networkError) {
    logger.error(
      `GraphQL network error (${operation.operationName}):`,
      networkError.message
    );
  }
});

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_GRAPHQL_ENDPOINT || "http://localhost:8080/query",
});

export const client = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network",
    },
  },
});
