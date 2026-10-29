# 34 · R5 Procedure, freeze, report

Phase 5 · 60 min · Depends: R2, R4 · Decisions: D5.1 D, D5.5 A · Spec:
specs/reconciliation.md "Procedure"

## Goal

The two passes, the contract refresh and the freeze as a stage, with the
coverage report. After this step `weave run … --to freeze` produces
`spec.lock.json`.

## What this step does

1. **Stale check**: if design or contract came from older flows, that stage
   reruns first.
2. **Pass 1, flows and design**: build the matrix, collect the design-side
   and flow-side mismatches, send each owner its patch call (blocking
   questions go to the terminal first in interactive mode), apply the
   patches, rerun that artifact's own validator; at most 2 rounds.
3. **Contract refresh**: if flows changed, the contract gets told which
   flows and steps changed.
4. **Pass 2, design and contract**: the same for data, operations and types;
   a missing business rule goes to flows as a question first, and the answer
   reaches the contract. At most 2 rounds.
5. **Freeze**: zero mandatory issues everywhere writes `spec.lock.json`
   with the frozen versions; otherwise the run stops naming the issues and
   their owners. A report with the matrix tables and every patch round.

After this step a run ends Phase 5 with a frozen, consistent spec.

## Implementation details

### `src/stages/reconcile/procedure.ts`

`reconcileStage = { name: 'reconcile', produces: ['matrix'], run }` and
`freezeStage = { name: 'freeze', produces: [], run }`.

`runReconcile(ctx)`:

1. Stale check (RECON-011): rerun `design` or `contract` by calling their
   stage functions directly when stale.
2. Pass 1, up to 2 rounds: `matrix = buildMatrix(...)`; `mismatches =
   findMismatches(...)` filtered to pass-1 rules (001, 002, 006, 009 design
   side, 010); split by owner. Interactive: blocking questions among the
   flows' mismatches go to the terminal first (same reader as step 13);
   answers ride along in the flows patch user message. For each owner with
   mandatory mismatches run `runSpecStage({ stage: 'patch:design', schema:
   DesignPatch, validate })` where `validate(patch)` applies the patch to a
   copy and returns that artifact's own validator issues (so a patch that
   breaks a rule loops within the same call); apply for real, write the new
   artifact version (`inputs` as before), save answers. Stop the pass when
   no mandatory mismatches remain.
3. Contract refresh: if pass 1 changed flows, one `patch:contract` call
   whose mismatches are "flows changed: F03 (steps …), F05" with the new
   steps and fields in the user message.
4. Pass 2, up to 2 rounds: rules 003, 004, 005, 007, 008, 009 contract side.
   RECON-007 first goes to a `patch:flows` call as a question; its answer
   then joins the contract patch's mismatch text.
5. Write `04-matrix.json` (artifact `matrix`, inputs flows, screens,
   contract) and `04-reconcile.md` = `renderMatrix` plus a "Rounds" section
   listing each patch call, its mismatches and `resolutions`.

`runFreeze(ctx)`: rerun every stage validator on the current artifacts and
`findMismatches`; zero mandatory → write `spec.lock.json` (the spec's shape,
`warnings` = count) and `state.stages.freeze = done`; otherwise throw
`StageFailed('freeze', issues)` listing owners (D5.5 A).

### Tests

`procedure.test.ts` with a fake llm and the golden freelancer workspace: with no
mismatches the procedure writes the matrix and freeze writes the lock; with
one planted RECON-002 the fake receives one `patch:design` call and the
lock's `screens.version` is 2.

## Done when

```sh
pnpm weave run fixtures/ideas/freelancer-workspace.md --run <id> --to freeze   # spec.lock.json written
```
