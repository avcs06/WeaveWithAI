# 31 · R2 Mismatch rules

Phase 5 · 60 min · Depends: R1 · Decisions: D5.2 A, D5.3 A · Spec:
specs/reconciliation.md "Mismatches"

## Goal

RECON-001 to 011, each mismatch carrying its owner, as pure functions over
the matrix and the three artifacts.

## What this step does

1. **11 mismatch rules as code**, each with the owner who must fix it:
   design (a step with no control, a field with no input, a public screen
   for a signed-in step, a new component serving nothing), contract (data a
   screen shows that no field provides, a step with no operation, type
   mismatches, unused operations), flows (questions the design raised, a
   business rule the contract needs), or the stale stage.
2. **Tests** on the golden set (no mandatory mismatches) and on planted
   defects, one per rule.

After this step reconciliation knows what to send to whom.

## Implementation details

### `src/agents/04reconcile/rules.ts`

```ts
export type Mismatch = Issue & { owner: 'flows' | 'design' | 'contract' | 'stale' };
export function findMismatches(input: { matrix: Matrix; flows: Flows; screens: Screens; contract: Contract; envelopes: { screens: Envelope<Screens>; contract: Envelope<Contract>; flows: Envelope<Flows> } }): Mismatch[];
```

Notes:

- 001: user step rows with no `interactiveNodes` → design.
- 002: a `fields` entry with no `inputs[field]` → design.
- 003: `matrix.unresolved` → contract, unless the attribute word appears in
  no flow step text or field of the steps that screen serves → design
  (the screen invented data).
- 004: rows with effects, no operations and `local: false` → contract.
- 005: ops whose `flowSteps` are all absent from every screen's `flowSteps`
  → contract, warning.
- 006: `screens.questions` and `screens.impossibleSteps` → flows.
- 007: ops with `needsRule` → flows, message is the rule text as a question.
- 008: for each submitted field with an input node and a body field: kinds
  through `FLOW_TO_KIND` and enum labels vs options; mismatch → contract;
  if the input node's `field` names a flow field that the step doesn't
  submit → design.
- 009: a `public` screen serving a step whose op's access isn't `public` →
  design; if the step's flow role has `signedIn: false` → contract.
- 010: a new component whose `usedOn` screens serve no step → design.
- 011: `envelopes.screens.meta.inputs.flows.hash !== envelopes.flows.meta.hash`
  (same for contract) → owner `stale`, `at` the stage name.

### Tests

`rules.test.ts`: the golden freelancer workspace set yields no mandatory
mismatches (print warnings); mutations on copies of the golden artifacts
trigger each rule: drop an input node (002), add `Project.budget` to a
node's data (003), remove an op (004), add `needsRule` (007), change a flow
field type (008), set a signed-in screen to public (009), bump the flows
hash (011).

## Done when

```sh
pnpm test -- src/agents/04reconcile/rules.test.ts
```
