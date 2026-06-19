# chrome-extension

Chrome Extension (Manifest V3) boilerplate built with **Vite + [@crxjs/vite-plugin](https://crxjs.dev/) + TypeScript + Vitest**.

It ships the three surfaces almost every extension needs, wired together with typed messaging:

- **Popup** (`src/popup/`) — UI with a click counter and a "read this page" button
- **Background service worker** (`src/background/`) — owns the counter, persists it in `chrome.storage`, mirrors it onto the toolbar badge
- **Content script** (`src/content/`) — injected into pages, answers `PING` with the page title/URL
- **`src/lib/`** — pure logic (unit-tested) and typed message contracts

## Quick start

```bash
make install   # npm install
make run       # vite dev server with HMR (writes dist/ for an unpacked load)
make build     # production build into dist/
```

Load it in Chrome:

1. `make build`
2. Open `chrome://extensions`, enable **Developer mode**
3. **Load unpacked** → select the `dist/` directory

## Commands

| Command | Description |
|---------|-------------|
| `make run` | Vite dev server (HMR) |
| `make build` | Build the unpacked extension into `dist/` |
| `make lint` | ESLint |
| `make format-check` | Prettier check |
| `make typecheck` | `tsc --noEmit` |
| `make test` / `make test-cov` | Vitest (with coverage) |
| `make ci` | lint + format-check + typecheck + test-cov + build |
| `make package` | Zip `dist/` for the Chrome Web Store |

## Testing

Vitest runs in a Node environment. Coverage targets the pure logic layer
(`src/lib/`, 80% threshold) — the chrome-API glue in `background/`, `popup/` and
`content/` is intentionally thin and verified by loading the unpacked extension.
Keep new business logic in `src/lib/` so it stays unit-testable.

## Customizing

- Edit `manifest.config.ts` for the name, permissions, and content-script
  `matches` (narrow `<all_urls>` to the sites you target before shipping).
- Icons live in `public/icons/` — replace the placeholders.
- Add new message types in `src/lib/messages.ts`.
