import { defineConfig } from 'vite'

// The dev / preview port is pinned so that `make run` / `make stop` / `make
// status` in the Makefile agree with what Vite actually listens on. Keep the
// numbers in sync with `PORT` in the Makefile.
export default defineConfig({
  server: {
    port: 5176,
  },
  preview: {
    port: 4176,
  },
})
