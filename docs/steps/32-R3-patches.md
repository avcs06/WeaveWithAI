# 32 · R3 Patches

Phase 5 · 60 min · Depends: R1 · Decisions: D5.4 B · Spec:
specs/reconciliation.md "Patches"

## Goal

Typed upserts and removals by id for flows, design and contract, applied
by pure functions that leave untouched items byte-identical.

## What this step does

1. **Three patch shapes**, one per artifact: upserts and removals by id, plus
   resolutions, assumptions, answers or questions. A model fixing an artifact
   returns only changes.
2. **Apply functions** merge a patch into the artifact: replace by id, append
   new items, remove by id, cascade (removing a screen removes its sections
   and nodes), refuse what would break references (an entity an operation
   still uses).
3. **Untouched items stay byte-identical**, verified by hashing them before
   and after.
4. **Tests** per artifact and the patch schemas through the bridge.

After this step fixes can't drift unrelated parts of a spec.

## Implementation details

### `src/stages/reconcile/patch.ts`

The spec's `FlowsPatch`, `DesignPatch` (built from the run-time screens
schemas: `makeDesignPatch(schemas)`), `ContractPatch`; and:

```ts
export function applyFlowsPatch(flows: Flows, patch: FlowsPatch): Flows;
export function applyDesignPatch(screens: Screens, patch: DesignPatch): Screens;
export function applyContractPatch(contract: Contract, patch: ContractPatch): { contract: Contract; refused: { entity: string; usedBy: string[] }[] };
```

Rules: upsert replaces by id or name, else appends in id order; remove
drops by id; `applyDesignPatch` removing a screen also drops its sections
and nodes, removing a section drops its nodes; `applyContractPatch` refuses
to remove an entity an operation still names and reports it; patches'
`assumptions`, `answers` and `questions` are appended (answers also go to
`input/answers.json` by the procedure, step 34). Arrays keep the original
object references for untouched items (don't clone the whole artifact), so
`hashOf` of an untouched flow is unchanged.

### Tests

For each artifact: upsert existing, upsert new, remove, cascade (design),
refused removal (contract), and "unrelated items unchanged" by comparing
`hashOf` of each untouched item before and after; the patch schemas pass
`toJsonSchema` within the limits (the flows patch nests like flows).

## Done when

```sh
pnpm test -- src/stages/reconcile/patch.test.ts
```
