# 02 · F2 Schema bridge

Phase 1 · 30 min · Depends: F1 · Decisions: D1.2, D1.4 · Spec: ARCHITECTURE.md
"Model layer"

## Goal

Turn any zod schema into the JSON Schema the Meta Model API accepts for
constrained decoding, and refuse shapes it rejects before a token is spent:
no recursion, nesting at most 10 levels, `anyOf` instead of `oneOf`.

## What this step does

1. **One function converts any zod schema into JSON Schema**, the format the
   model API needs to constrain its output to a shape.
2. **Clean the result so the API accepts it**: drop the `$schema` marker and
   turn `oneOf` (what zod emits for unions) into `anyOf`.
3. **Refuse shapes the API rejects before a token is spent**: a recursive
   schema or more than 10 levels of nesting throws an error naming the
   schema.
4. **Report size numbers** (depth, number of properties, number of enums) so
   later tests can pin every stage schema under the limits.
5. **Tests** for a good schema, a recursive one, an 11-level one and a union.

After this step every stage converts its schema the same way, through one door.

## Before you start

- zod 4.6's `z.toJSONSchema` emits `oneOf` for discriminated unions, a
  `$schema` key and `additionalProperties: false`. Meta rejects `oneOf` only
  in strict mode, but `anyOf` is safe in both, so always rewrite.
- Every stage schema in the specs stays within 8 levels; the biggest (the
  contract) has 128 properties. The bridge reports these numbers so a schema
  that grows past the limits fails a test, not a run.

## Implementation details

### 1. `src/core/schema.ts`

```ts
import { z } from 'zod';

export class SchemaBridgeError extends Error {}

export type JsonSchema = Record<string, unknown>;
export type BridgedSchema = {
  name: string;
  schema: JsonSchema;
  stats: { depth: number; properties: number; enums: number };
};

export const MAX_DEPTH = 10;

export function toJsonSchema(schema: z.ZodType, name: string): BridgedSchema {
  let raw: JsonSchema;
  try {
    raw = z.toJSONSchema(schema, {
      target: 'draft-2020-12',
      io: 'output',
      reused: 'inline',      // no $defs/$ref for shared sub-schemas
      cycles: 'throw',       // recursion is a bridge error
      unrepresentable: 'throw',
    }) as JsonSchema;
  } catch (error) {
    throw new SchemaBridgeError(`${name}: ${(error as Error).message}`);
  }
  delete raw.$schema;
  const schemaOut = rewrite(raw);
  const stats = measure(schemaOut);
  if (stats.depth > MAX_DEPTH)
    throw new SchemaBridgeError(`${name} nests ${stats.depth} levels; Meta allows ${MAX_DEPTH}`);
  return { name, schema: schemaOut, stats };
}
```

`rewrite(node)`: recursive over objects and arrays; renames the key `oneOf`
to `anyOf` (merging if both exist), leaves everything else. `measure(node)`:
depth counts object and array nesting (root object = 1; a property or `items`
whose schema is an object or array adds one; `anyOf` branches don't add a
level themselves, their contents do); `properties` sums the keys of every
`properties` object; `enums` counts every `enum` array.

Also export `assertWithinLimits(bridged, { properties?: number })` for tests
that want to pin a stage schema's size.

### 2. `src/core/schema.test.ts`

1. Nested object three deep with an array of objects: passes; `stats.depth`
   equals 4 and `properties` equals the count you can see.
2. `const Node = z.object({ children: z.array(z.lazy(() => Node)) })` throws
   `SchemaBridgeError` mentioning the cycle.
3. A generated 11-level object (`let s = z.object({ v: z.number() }); for 10
   times s = z.object({ s })`) throws with "nests 11 levels".
4. `z.discriminatedUnion('kind', [...two objects...])`: output contains
   `anyOf`, and a deep walk finds no `oneOf` key anywhere.
5. No `$schema` key at the root.

## Done when

```sh
pnpm test -- src/core/schema.test.ts   # 5 passing
pnpm typecheck
```

## Watch out

- Keep `additionalProperties: false` in the output; Meta accepts it and the
  model then can't add keys the validators don't know.
- `describe()` on fields becomes `description` and is sent to the model: keep
  descriptions in the schemas short and useful, as the specs have them.
