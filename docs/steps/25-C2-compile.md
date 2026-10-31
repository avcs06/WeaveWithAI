# 25 · C2 Contract compile

Phase 4 · 60 min · Depends: C1 · Decisions: D4.1 D, D4.2 F · Spec:
specs/contracts.md "Compile"

## Goal

Pure functions from a contract to zod schemas (inputs, views, list queries,
pages) and, from the same table, to zod source text, so the validators and
the generated app agree on every field.

## What this step does

1. **One table maps every field kind to two things**: the zod schema used at
   run time (to validate seeds and examples now, and requests in the mock
   API later) and the zod source text emitted into generated apps. Both come
   from the same row, so they can't drift.
2. **Derived schemas per entity**: create input (client fields), update input
   (all optional), view (everything not sensitive plus server fields), list
   query (page, size, sort, search, filters) and page.
3. **Coercion** turns seed and example values written as text into typed
   values.
4. **Tests** show sensitive fields missing from views, server fields missing
   from inputs, limits enforced, and the emitted source compiling.

After this step the contract can be checked for real and later compiled into
an app without hand-written schemas.

## Implementation details

### `src/agents/03contract/compile.ts`

One table drives both runtime schemas and emitted source:

```ts
type KindDef = { build: (f: EntityField) => z.ZodType; source: (f: EntityField) => string; ts: string };
const KIND: Record<FieldKind, KindDef> = {
  string:   { build: (f) => withLength(z.string(), f), source: (f) => `withLength(z.string(), ${lim(f)})`, ts: 'string' },
  text:     { … z.string() … },
  email:    { build: () => z.email(), source: () => 'z.email()', ts: 'string' },
  url:      { build: () => z.url(), … },
  phone:    { build: () => z.string().regex(/^\+?[0-9 ()-]{6,20}$/), … },
  int:      { build: (f) => withRange(z.number().int(), f), …, ts: 'number' },
  decimal:  { build: (f) => withRange(z.number(), f), … },
  money:    { build: (f) => withRange(z.number().int(), f), … },   // minor units
  percent:  { build: () => z.number().min(0).max(100), … },
  boolean:  { build: () => z.boolean(), …, ts: 'boolean' },
  date:     { build: () => z.iso.date(), …, ts: 'string' },
  time:     { build: () => z.string().regex(/^\d{2}:\d{2}$/), … },
  datetime: { build: () => z.iso.datetime(), … },
  enum:     { build: (f, enums) => z.enum(keysOf(f.enum)), source: (f) => `${f.enum}Schema`, ts: (f) => f.enum },
  ref:      { build: () => z.uuid(), source: () => 'z.uuid()', ts: 'string' },
};
```

Exports:

```ts
export function fieldSchema(f: EntityField, enums: Enum[]): z.ZodType;   // list → z.array, nullable → .nullable(), default → .default()
export function fieldSource(f: EntityField): string;                      // same, as TypeScript source
export function createInput(e: Entity, c: Contract): z.ZodObject;         // client fields only; required as declared
export function updateInput(e: Entity, c: Contract): z.ZodObject;         // createInput.partial()
export function view(e: Entity, c: Contract): z.ZodObject;                // non-sensitive client and server fields + derived + id, createdAt, updatedAt, ownerId (user-owned)
export function listQuery(op: Operation, e: Entity, c: Contract): z.ZodObject; // page, pageSize (max 100), sort (allowed values with - prefix), q when search, each filter field
export function page(viewSchema: z.ZodType): z.ZodObject;                 // { items, page, pageSize, total }
export function coerceValue(f: EntityField, text: string): unknown;       // seed and example values written as text → typed
export function compileAll(c: Contract): Record<string, { createInput; updateInput; view }>;
export function sourceFor(e: Entity, c: Contract): { schemaTs: string };  // the full entities/<e>/schema.ts text, used by step 37
```

Enum schemas: `z.enum(values.map((v) => v.key))`; in source,
`export const StatusSchema = z.enum(['to_do', 'in_progress', 'done'])` with
`labels` beside it for the UI.

### Tests

`compile.test.ts` on the reading-list contract fixture (written in step
26; create a minimal one now and extend it there):

- `view` has no `passwordHash`-like sensitive field; has `id`, `createdAt`.
- `createInput` has no server field; a required client field is required.
- `updateInput` accepts `{}`.
- `listQuery` rejects `pageSize: 500` and an unknown sort field.
- `coerceValue` turns `"42"` into 42 for `int`, `"true"` into `true`,
  keeps `"2026-11-10"` for `date`.
- `sourceFor` output parses as TypeScript (`ts.transpileModule` without
  diagnostics) and contains `export const`.

## Done when

```sh
pnpm test -- src/agents/03contract/compile.test.ts
```

## Watch out

- One table, two outputs; never hand-write zod source in step 37.
- zod 4 names: `z.email()`, `z.url()`, `z.uuid()`, `z.iso.date()`,
  `z.iso.datetime()`.
