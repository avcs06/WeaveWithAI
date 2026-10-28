# 15 · DS1 Design-system inventory

Phase 3 · 45 min · Depends: F1 · Decisions: D3.1 B · Spec: ARCHITECTURE.md
"Design-system inventory"; specs/design.md "Inputs"

## Goal

The design system as data the prompts and validators can use: components
with props and variant values, recipes, tokens; loaded once, cached by
content hash.

## What this step does

1. **Run the template's exporter** as a child process to get the design
   system as data: every component with its props, variant values,
   description, superseded alternatives and recipe; plus tokens.
2. **Cache it by content hash** of the design-system sources, so loading is
   instant until the design system changes and never stale after it does.
3. **Derive what prompts and schemas need**: a slim text summary (one line
   per component, under 6 KB) for prompts; the lists of component names,
   spacing keys and radius keys for schemas and validators.
4. **Keep a real export as a test fixture**; `weave ds` prints counts.

After this step the design stage knows exactly what the design system offers.

## Before you start

- `template/tools/export-design-system.mjs` prints
  `{ components, recipes, tokens }` and must run with the template as working
  directory (it `chdir`s itself). It needs `mcps/frontend/dist` built
  (`pnpm --dir template mcp:setup` once). Loading takes about 7 seconds.
- `components[].props[].allowedValues` carries variant values;
  `invalidAlternatives` lists what each component supersedes; `recipe` names
  the recipe file.

## Implementation details

### 1. `src/ds/inventory.ts`

```ts
export type InventoryProp = { name: string; type: string; required: boolean; allowedValues?: string[]; description?: string };
export type InventoryComponent = { name: string; category: string; description: string; variantProps: string[]; invalidAlternatives: string[]; recipe: string | null; props: InventoryProp[] };
export type Inventory = { components: InventoryComponent[]; recipes: unknown[]; tokens: Record<string, unknown> };

export async function inventory(opts?: { templateDir?: string; cacheDir?: string }): Promise<Inventory>;
export function inventorySummary(inv: Inventory): string;
export function dsNames(inv: Inventory): [string, ...string[]];
export function spacingKeys(inv: Inventory): [string, ...string[]];
export function radiusKeys(inv: Inventory): [string, ...string[]];
```

`inventory()`: hash = sha256 over the sorted list of `path + sha256(content)`
for files under `template/packages/*/src/**/*` (excluding tests and stories),
`template/tokens.ts`, `template/colors.ts`, `template/designsystem.config.json`.
Cache file `.weave-cache/inventory-<hash>.json`; on a miss run
`execa('node', ['tools/export-design-system.mjs'], { cwd: templateDir, maxBuffer: 64 MB })`,
parse `stdout`, write the cache. Use `node:fs/promises` and `globSync` from
`node:fs` (Node 22+).

`inventorySummary`: one line per component, `Name (category): description.
Variants: variant=primary|danger, size=sm|md|lg`, descriptions cut at the
first sentence; aim under 6 KB for the current 40-odd components. Sort by
category then name.

`spacingKeys`: the keys of the spacing group in `tokens` (how the exporter
nests tokens is visible in the fixture; adapt the accessor) as strings
`'0', '0.25', …, '16'`. `radiusKeys` the same for radius.

### 2. Fixture and CLI

`node template/tools/export-design-system.mjs > src/ds/__fixtures__/inventory.json`
(run from anywhere; redirect to a file, don't pipe to `head`). `pnpm weave
ds` prints component count, recipe count, token count and the summary's
byte size.

### 3. `src/ds/inventory.test.ts`

- From the fixture: `dsNames` includes `Button` and `Table`; `spacingKeys`
  includes `'4'`; the summary is under 6 KB and mentions every component name.
- With a temp `cacheDir` and a fake exporter (inject the command through an
  option for tests): first call runs it, second call doesn't and returns in
  under 200 ms.

## Done when

```sh
pnpm weave ds                       # counts and the summary size
pnpm test -- src/ds
```

## Watch out

- The exporter writes to stdout only; a `console.log` added to it would
  break the JSON.
- The inventory includes `web/app/components/*` of the template; generated
  apps add their own components later, which is fine.
