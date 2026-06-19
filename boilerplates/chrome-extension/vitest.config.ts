import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      // Cover the pure logic layer (src/lib). The chrome-API glue in
      // background/popup/content is thin and verified by loading the unpacked
      // extension; message contracts in messages.ts are type-only.
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/messages.ts', '**/*.test.ts', '**/*.d.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
