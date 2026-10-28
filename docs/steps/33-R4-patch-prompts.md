# 33 · R4 Patch prompts

Phase 5 · 40 min · Depends: R3 · Spec: specs/reconciliation.md "Procedure";
drafts `prompt-patch-flows.md`, `prompt-patch-design.md`, `prompt-patch-contract.md`

## Goal

The three patch calls' prompts and user messages, filled by code from a
mismatch list and the artifacts involved.

## What this step does

1. **Fill the three patch prompts** from a mismatch list, the design-system
   summary and the conventions.
2. **Build the user messages** with only what the fix needs: the flows; the
   IA plus the nodes of the screens involved; the flows, the contract and the
   data needs involved.
3. **Review the drafts** so each names the patch arrays exactly as the
   schemas spell them.
4. **Tests** fill from a sample list.

After this step each owner gets a precise, small fix request.

## Implementation details

### `src/stages/reconcile/prompt.ts`

```ts
export function formatMismatches(list: Mismatch[]): string;   // "- RECON-002 at F03.S02: message" per line
export function flowsPatchPrompt(list: Mismatch[]): string;    // mismatches
export function flowsPatchUser(scope: Scope, flows: Flows, answers: Answers): string;
export function designPatchPrompt(list: Mismatch[], inv: Inventory): string;   // mismatches, dsSummary
export function designPatchUser(flows: Flows, screens: Screens, involvedScreens: string[]): string;  // the IA, the nodes of the involved screens only
export function contractPatchPrompt(list: Mismatch[]): string;   // mismatches, conventions
export function contractPatchUser(flows: Flows, contract: Contract, dataNeeds: MatrixRow['dataNeeds'][]): string;
```

`involvedScreens` come from the mismatches' `at` ids (screen prefix) plus
any screen serving the steps named. Review the drafts: each must say
"return only changes" and name the upsert and remove arrays exactly as the
patch schemas spell them.

### Tests

Each prompt fills from a sample mismatch list with no leftover
placeholders; `designPatchUser` includes only the nodes of the named
screens (count nodes in the JSON block).

## Done when

```sh
pnpm test -- src/stages/reconcile/prompt.test.ts
```
