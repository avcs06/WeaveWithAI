# 19 · DS5 Screens schemas

Phase 3 · 45 min · Depends: DS1, DS2 · Decisions: D3.2 C, D3.11 B · Spec:
specs/design.md "Screens"

## Goal

`makeScreensSchema(inventory)` exactly as the spec: component names and
spacing keys become enums at run time, so constrained decoding can't
produce a component that doesn't exist.

## What this step does

1. **The screens schema is built at run time**: the design-system component
   names and the spacing keys become enums, so constrained decoding can't
   produce a component that doesn't exist or a gap that isn't a token.
2. **Two output shapes**: the information architecture (navigation, screens,
   sections, new components) and one screen's nodes (every element with its
   component, props, text, role, field, data, flow steps and states).
3. **A test** builds the schemas from the fixture inventory and proves they
   fit the API's limits.

After this step the design stage can ask for structure and content
separately, each in a shape the validators understand.

## Implementation details

### 1. `src/stages/design/schema.ts` (second part)

Copy the spec's `makeScreensSchema(dsNames, spacingKeys)` and the constants
(import the constants from `src/config/design.ts` instead of redefining
them; `Question` from the flows schema). Export:

```ts
export type ScreensSchemas = ReturnType<typeof makeScreensSchema>;
export type Ia = z.infer<ScreensSchemas['Ia']>;
export type Node = z.infer<ScreensSchemas['Node']>;
export type Screens = Ia & { nodes: Node[] };          // 02-screens.json
export function schemasFor(inv: Inventory): ScreensSchemas; // makeScreensSchema(dsNames(inv), spacingKeys(inv))
```

`Node.props` stays an array of `{ name, value }` pairs (not a record):
constrained decoding handles it and the validator checks values against
the inventory.

### 2. `src/stages/design/schema.test.ts`

From `src/ds/__fixtures__/inventory.json`:

- `toJsonSchema(Ia, 'Ia')` and `toJsonSchema(ScreenNodes, 'ScreenNodes')`
  pass; depth ≤ 10 (print the numbers).
- The `ds` ref's `name` enum lists every inventory component.
- `Brief` and `Theme` also pass the bridge.

## Done when

```sh
pnpm test -- src/stages/design/schema.test.ts
pnpm typecheck
```

## Watch out

- The enum of component names is long; if the API ever rejects enum size,
  the fallback is `z.string()` plus DESIGN-003-style validation. Note it in
  ARCHITECTURE "Model layer" if that happens.
