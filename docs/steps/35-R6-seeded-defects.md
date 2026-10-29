# 35 · R6 Seeded defects and every golden idea

Phase 5 · 60 min · Depends: R5 · Spec: specs/reconciliation.md "Done when"

## Goal

Proof that reconciliation finds and fixes the three seeded defects within
the round limits, then a frozen spec for every golden idea. Gate G4.

## What this step does

1. **Three seeded-defect tests**: a deleted body field, a node showing data no
   field provides, an operation needing a business rule. Each runs the
   procedure offline with model answers recorded once from a real run, and
   asserts the defect is found and fixed within the limits.
2. **Freeze every golden idea**; tune patch prompts only; the unseen idea
   untuned; save the frozen artifacts.

After this step gate G4 is met: the planning half of the generator is
proven on three ideas.

## Implementation details

### 1. Seeded defect tests (`src/stages/reconcile/seeded.test.ts`)

Each test copies the golden freelancer-workspace artifacts, plants one defect,
runs the procedure with a fake llm whose responses were recorded once from
a real run (save them as `__fixtures__/replays/<defect>-<call>.json`, the
response JSON only), and asserts:

1. A body field deleted from `createProject`: RECON-002 or CONTRACT-012
   reported; after the run the contract has the field back; 1 patch call.
2. A node showing `Project.budget`: RECON-003; the contract gains `budget`
   or the node loses it; 1 patch call to contract or design.
3. An operation with `needsRule: "what makes a slot available"` (on the
   freelancer-workspace golden set): RECON-007 sends a question to flows, the
   answer appears in the contract patch's input, and the final contract has
   `needsRule: ""`.

Record the responses by running each scenario once for real with
`LLM_REPLAY=false` and copying the `llm/patch:*` files.

### 2. Freeze every golden idea

`pnpm weave run … --run <id> --to freeze` for each; read `04-reconcile.md`;
tune patch prompts only; ecommerce store untuned first. `pnpm weave golden <runId>
<idea> --stages matrix,lock` (extend `golden` to copy `spec.lock.json`).

## Done when

Gate **G4**: every golden spec set freezes with zero mandatory issues; the
three seeded tests pass offline; unchanged items keep their hashes across
patches (assert in test 1 on an untouched entity).
