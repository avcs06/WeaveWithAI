# weave-template

A React design system in an Nx workspace: components (`packages/ui`), tokens
and themes (`packages/styles`), and hooks and state helpers (`packages/utils`),
with a Next.js app (`web`) and an MCP server that guides AI agents building UI
with the design system.

## Generate a project

The generator uses only Node.js built-ins; installing dependencies first is not
required. Automatic setup requires Node.js 22.18+ (22.x) or 24.11+ and pnpm
(or select `--package-manager=npm`). The source and target must not overlap, and
the target must be missing or empty. Repository contents are copied directly
into the target, not into an extra nested folder.

From the repository root:

```sh
# Frontend only (default)
node tools/generate.mjs . ../my-app

# Include the Express server
node tools/generate.mjs . ../my-fullstack-app --include-server
```

`--include-server=true` and `--include-server=false` are also accepted.
After copying and updating configuration, the generator installs root dependencies,
runs `mcp:setup` to install/build the MCP, then runs `mcp:check` to verify
that tokens and components load. Commands run sequentially inside the target.
It does not start development or MCP servers. Setup errors stop subsequent steps,
preserve the generated files, and print recovery instructions.

Use `--package-manager=npm` for root `npm install` instead of pnpm. The isolated
MCP always uses its own npm lockfile. Use `--skip-setup` for an offline/copy-only
generation; run installation and MCP setup manually afterward.
Both variants exclude all `node_modules`, Git history, Nx/Next/Turbo caches,
`dist`, coverage output, and TypeScript build-info files. Other files, including
dotfiles and local environment files, are copied; check them before sharing a
generated project.

The frontend-only variant removes `express`, `@types/express`, `@nx/express`,
`@nx/node`, `@nx/webpack`, and `webpack-cli` from the package manifest, plus the
Nx Webpack plugin registration. Shared frontend tooling remains; removed direct
dependencies may still be required transitively by shared tooling.
Root lockfiles are omitted in this variant so they can be regenerated for the changed
dependencies. The server-inclusive variant preserves the manifest and lockfile.

The MCP source, nested lockfile, design-system configuration, and validation
tools are copied in both variants. MCP build output and dependencies are
excluded and recreated during setup.

After generating, copy `web/.env.example` to `web/.env.local`, then run `pnpm dev`. With the server
included, run `pnpm nx serve server` in a separate terminal.

Test the generator with:

```sh
node --test tools/generate.test.mjs
```

## Run

From the repository root:

```sh
pnpm install --frozen-lockfile
cp web/.env.example web/.env.local
pnpm dev
```

The frontend uses port 3001, leaving port 3000 free for a backend.
Set `NEXT_PUBLIC_API_URL` in `web/.env.local` to change the API origin.
`pnpm build`, `pnpm start`, `pnpm typecheck`, `pnpm lint`, and `pnpm test`
are also available. Google fonts are downloaded by Next during builds.
The scripts use Webpack; the Next configuration enables compilation of the
shared packages outside the web directory. The shared TypeScript config includes
an explicit base URL so those aliases resolve during builds.

## Structure

| Folder               | Purpose                                                            |
| -------------------- | ------------------------------------------------------------------ |
| `web/app/(routes)`   | Pages, with their page-only components and controllers, and layout |
| `web/app/blocks`     | Reused complex components and controllers                          |
| `web/app/components` | Reused basic components                                            |
| `web/app/entities`   | Empty home for domain types and API/query definitions              |
| `web/app/shared`     | HTTP transport, route hooks, React Query provider                  |
| `packages/assets`    | Shared asset package                                               |
| `packages/styles`    | Tokens, themes, fonts, Tailwind and vanilla-extract                |
| `packages/utils`     | Zustand/context helpers, hooks, dates and general utilities        |
| `packages/ui`        | Reusable React/Radix components and their tests/stories            |
| `tools/eslint`       | Custom styling and import rules                                    |
| `server`             | Optional Express starter                                           |

## State and requests

React Query is provided at the application root for server state. Zustand helpers
are available from `@packages/utils/state`: `createStore`,
`createPersistentStore`, `createStoreContext`, and associated utilities.
Create domain-specific stores only when needed. Persistence helpers use browser
storage; avoid reading browser-only values in server-rendered code.

`Server` from `@app/shared/api` provides GET, POST, PATCH, and DELETE requests,
query parameters, JSON handling, empty responses, and `ApiError` on HTTP failures.
Pass request headers (including Authorization) and AbortSignals through the final
options argument. No token storage or mock API responses are included.

## Conventions

Spacing uses numeric keys at 4px per unit: `tokens.spacing[0.25]` is `1px`,
`tokens.spacing[0.5]` is `2px`, and `tokens.spacing[4]` is `16px`.
The scale contains 0, 0.25, and half-unit steps from 0.5 through 12.
Tailwind uses the same fixed-pixel values (`p-4`, `gap-0.5`, `size-12`), not rem.
Fixed line-heights follow the same naming rule (`tokens.lineHeight[4]` is
`16px`); use unitless numbers (for example, `lineHeight: 1.4`) for
font-relative multipliers rather than fixed-pixel tokens.
Radius uses the same numeric scale (`tokens.radius[4]` is `16px`), with
`tokens.radius.full` for circles and pills. Use numeric opacity values
(for example, `opacity: 0.55`) and numeric z-index values when a named layer
such as `tokens.zIndex.modal` does not apply.

- Layout styles use only Tailwind. A class list has at most 50 characters, and
  an element at most two lists.
- Light/dark color modes from one palette in `colors.json` (see Colors below).
- Nx dependency layers: assets → styles → utils → ui → web.
- Application imports flow from shared → entities → components → blocks → routes.
- The ESLint configuration enforces a custom Tailwind allowlist, import ordering,
  explicit barrel exports, and sibling import restrictions.

## Colors

Every color set has the same twelve roles (`ColorSet` in `colors.ts`): `bg`,
`fg`, `fgMuted`, `border`, `hoverBg`, `accentBg`, `accentFg`, `accentBorder`,
`accentHoverBg`, `focus`, `accentFocus`, and `shadow`.

`base`, status, and the surface's `divider`, `backdrop` and `skeleton` stay the
same in every project. Only primary and the surface page colors (`pageBg`,
`frameBg`, `pageFg`, `pageFgMuted`) change per project. A project that needs
additional colors adds them under entity. If a usage case has no matching color,
add it to surface.

Color sets are for controls and containers, not the page. `surface` holds the
page colors and every color outside the set roles (`SurfaceColors`). Only
sections use `pageFg` and `pageFgMuted`.

| Set                     | Use                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `tokens.color.primary`  | Brand. Change these values per project.                                                           |
| `tokens.color.base`     | Neutral controls and containers: cards, text, borders.                                            |
| `tokens.color.surface`  | `pageBg`, `frameBg`, `pageFg`, `pageFgMuted`, `divider`, `backdrop`, `skeleton`. Not a color set. |
| `tokens.color.<status>` | `success`, `warning`, `error`, `info`.                                                            |
| `tokens.color.<entity>` | Additional project-specific sets, added under `entity`. None by default.                          |

- Pair foregrounds with their own set: default foregrounds on the two default
  backgrounds, `accentForeground` on the two accent backgrounds.
- Selected uses the hover background; disabled uses muted foreground or opacity;
  accent doubles as the emphasized/inverse pair (for example, tooltips use
  `base.accent*`). There are no `selected`, `disabled` or `card` colors.
- Status values are fixed Radix-derived palettes checked for WCAG contrast; never
  re-tint them for a brand. Never communicate status by color alone.
- `backdrop` is opaque; components apply their own opacity.
- Mode is chosen by the theme class, never in components. Tailwind color names
  mirror token paths (`bg-error-accent`) and follow the light/dark mode.
- `colors.json` is type-checked against the contract when the styles build:
  missing or leftover roles fail.

## Validation

Run `pnpm typecheck`, `pnpm lint` and `pnpm test`. To check only the app, run
`pnpm nx lint web`.
