import { defineConfig } from 'vite'

// The dev / preview port is pinned so that `make run` / `make stop` / `make
// status` in the Makefile agree with what Vite actually listens on. Keep the
// numbers in sync with `PORT` in the Makefile.
//
// `strictPort` makes the dev server fail instead of silently moving to the next
// free port: if 5176 is taken, `make run` must not start on 5177 while
// `make stop` / `make status` keep looking at 5176.
export default defineConfig({
  server: {
    port: 5176,
    strictPort: true,
  },
  preview: {
    port: 4176,
  },
})
