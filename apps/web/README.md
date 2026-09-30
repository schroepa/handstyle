# Handstyle web

Next.js app: theme generator + dynamic shadcn registry.

## Dev

```bash
pnpm --filter web dev
```

Open http://127.0.0.1:3010

## Dynamic registry (Phase 5)

Given a base64url ThemeSpec token `SPEC`:

| URL | Item |
|-----|------|
| `/r/t/SPEC/theme` | Theme CSS + `@theme` (`npx shadcn add` target) |
| `/r/t/SPEC/tokens` | CSS custom properties only |
| `/r/t/SPEC/registry` | Mini index |
| `/r/t/SPEC/opengraph-image` | OG preview |

Example:

```bash
npx shadcn add http://127.0.0.1:3010/r/t/<SPEC>/theme
```

### Cross-registry (`@cmplt`)

UI components stay on the cmplt host. In a consumer `components.json`:

```json
{
  "registries": {
    "@cmplt": "https://<cmplt-host>/r/{name}.json"
  }
}
```

Then e.g. `npx shadcn add @cmplt/button` after installing the Handstyle theme.

`handstyle.dev` is a domain placeholder until production hosting is decided.

## Smoke

With the dev server running:

```bash
pnpm --filter web e2e:registry
# optional full CLI:
SHADCN_E2E=1 pnpm --filter web e2e:registry
```
