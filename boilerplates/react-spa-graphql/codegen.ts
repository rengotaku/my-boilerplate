import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: process.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:8080/query',
  documents: 'src/graphql/operations/**/*.graphql',
  generates: {
    'src/graphql/generated/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo',
      ],
      config: {
        withHooks: true,
        withComponent: false,
        withHOC: false,
      },
    },
  },
  ignoreNoDocuments: true,
}

export default config
