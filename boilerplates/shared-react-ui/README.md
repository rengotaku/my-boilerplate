# shared-react-ui

Single source of truth for shadcn/ui primitives shared across the React templates
(`react-spa`, `react-spa-cloudflare`, `react-spa-graphql`, and future React
templates). Components are defined here once and **composed into each template's
`src/components/ui/`** at scaffold time, so the final scaffolded project owns
its UI files and the shadcn "copy/paste to add" workflow is preserved.

## Layout

```
shared-react-ui/
  src/
    ui/                  # Components shipped to consumer templates
      button.tsx
      button-variants.ts
      input.tsx
      time-picker.tsx
      *.stories.tsx      # Excluded during compose (Ladle gallery only)
    lib/
      utils.ts           # cn() helper (re-shipped to each template)
    index.css            # Tailwind v4 + shadcn theme tokens (Ladle preview)
  .ladle/                # Gallery configuration
  package.json
  vite.config.ts
  tsconfig.json
```

## Gallery (Ladle)

```bash
cd shared-react-ui
npm install
npm run gallery          # Vite-native component gallery on http://localhost:61000
npm run gallery:build    # Static gallery in build/
```

`*.stories.tsx` files live alongside the components and are excluded from the
compose step, so consumer templates never receive them.

## How composition works

Each React template root contains a `.shared-ui.toml` manifest:

```toml
[ui]
src = "shared-react-ui/src/ui"
dest = "src/components/ui"
```

`scripts/scaffold/lib/compose.sh` reads the manifest at scaffold time and
rsync's the listed source into the destination, excluding `*.stories.tsx`. The
manifest is removed from the scaffolded project so the result is self-contained.

For local monorepo development, each template's `Makefile` exposes a
`compose-ui` target that performs the same merge from `../shared-react-ui/`,
making local `make install` / `make ci` work without touching scaffold.

## Adding a component

1. Drop `<name>.tsx` and `<name>.stories.tsx` into `src/ui/`.
2. Verify it renders in `npm run gallery`.
3. No template-level changes are needed — `compose.sh` picks up the file.

## Why not a workspace package?

Distributing as an npm/workspace package was considered but rejected: shadcn's
ergonomic is "copy the component into your project and edit it freely". A
package import would force consumers to fork upstream to make local tweaks.
Compose-at-scaffold preserves the shadcn workflow.
