# 30 · R1 Coverage matrix

Phase 5 · 60 min · Depends: C6, DS9 · Decisions: D5.1 D · Spec:
specs/reconciliation.md "Coverage matrix"

## Goal

One pure function that lines up every flow step and alternative with the
screens, nodes and operations that serve it, and resolves every data
reference a screen shows.

## What this step does

1. **One pure function builds the coverage matrix**: a row per flow step and
   alternative listing the screens that serve it, the interactive nodes, the
   input nodes per submitted field, the operations, whether the contract calls
   it local, and every piece of data a screen shows resolved to an entity
   field.
2. **Data resolution** matches `Noun.attribute` to an entity by noun and a
   field by name or flow field, ignoring case and underscores.
3. **A table per flow** is rendered for the reconciliation report.
4. **Tests** on the golden project tracker.

After this step the three artifacts can be compared by id instead of by
reading.

## Implementation details

### `src/stages/reconcile/matrix.ts`

```ts
export type MatrixRow = {...};   // the spec's type
export type Matrix = { rows: MatrixRow[]; unresolved: { node: string; ref: string }[] };
export function buildMatrix(flows: Flows, screens: Screens, contract: Contract): Matrix;
export function resolveDataRef(ref: string, contract: Contract): { entity: string; field: string } | null;
export function renderMatrix(matrix: Matrix, flows: Flows): string;   // the table part of 04-reconcile.md
```

- Rows: every step (`kind` user or system) and every alternative
  (`kind: 'alternative'`), in flow order.
- `fields`: names submitted at a user step. `effects` copied.
- `screens`: screens whose `flowSteps` include the id. `interactiveNodes`:
  nodes with role `primary-action`, `secondary-action`,
  `destructive-action`, `navigation` or `input` whose `flowSteps` include
  the id. `inputs`: field name → ids of `input` nodes with that `field` on
  a screen serving the step.
- `operations`: ops whose `flowSteps` include the id. `local`: id in
  `contract.localSteps`.
- `dataNeeds`: for every node on a screen serving the step, each `data`
  entry resolved with `resolveDataRef`: entity by `noun`, then a field whose
  `name` or `flowField` equals the attribute after lower-casing and removing
  spaces and underscores, or `id`, `createdAt`, `updatedAt`.
- `renderMatrix`: per flow a table: step, screens, nodes, operations,
  status (`ok`, `no screen`, `no node`, `no operation`, `local`, `unresolved data`).

### Tests

`matrix.test.ts` on the golden project tracker (`fixtures/golden/project-tracker/`):
every row has screens and operations or is local; `unresolved` is empty
(print it if not: that's a real finding for step 31); `resolveDataRef('Task.due_date', …)`
resolves to `dueDate`.

## Done when

```sh
pnpm test -- src/stages/reconcile/matrix.test.ts
```
