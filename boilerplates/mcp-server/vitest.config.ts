import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'json'],
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/**/*.test.ts', 'tests/**/*.test.ts', '**/*.d.ts'],
    },
  },
})
