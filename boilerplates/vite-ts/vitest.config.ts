import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'json'],
      // Only the pure logic layer is covered. `src/main.ts` is the DOM wiring
      // for the sample page and is verified by looking at the page, so it is
      // excluded here (the same split mcp-server uses for src/index.ts).
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts', '**/*.test.ts', '**/*.d.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
