# 14 · FL6 Reference ideas

Phase 2 · 60 min · Depends: FL5 · Decisions: D12.1 · Spec: specs/flows.md
"Done when"

## Goal

Prompts tuned on two ideas, one unseen idea run untouched first, and golden
artifacts saved for every later stage to develop offline. Gate G1.

## What this step does

1. **A `weave golden` command** copies a run's accepted artifacts into
   `fixtures/golden/<idea>/` and prints the rounds, tokens and cost.
2. **Tune on two ideas** (freelancer workspace, dashboard editor): read each
   flows markdown as a spec reviewer, fix the prompt for anything you'd
   reject, rerun. Validators are never touched.
3. **Run the unseen idea once** (ecommerce store) without tuning on it, and
   record the result either way: it is the honest test. Then tune on it too
   until it passes; it is the second end-to-end idea.
4. **Save the accepted artifacts** and fill the README table.

After this step later stages can be developed offline on real, accepted
flows, and gate G1 is met.

## Implementation details

### 1. `weave golden` command

Add to `src/cli.ts`: `golden <runId> <ideaName> [--stages scope,flows]`
copies the named artifacts from the run to `fixtures/golden/<ideaName>/`
(same file names) and prints the rounds, tokens and cost per stage from the
run's events so the README table can be filled.

### 2. Tuning loop (freelancer workspace, dashboard editor)

For each idea: `pnpm weave run fixtures/ideas/<idea>.md --to flows`. Read
`01-flows/04-reconcile.md` fully. Fix the prompt for anything you would reject in a spec
review: missing alternatives, vague website responses, fields without
examples, flows that should exist (sign out, search where lists grow). Rerun
with `--from scope` or `--from flows` as needed; the replay cache makes
unchanged calls free. Never touch `validate.ts`; if a rule is wrong, add a
task in PLAN.md and stop for the user.

### 3. The unseen test

Run `fixtures/ideas/ecommerce-store.md` once with the tuned prompts. Record
the result in `fixtures/golden/README.md` under an "Ecommerce store, untuned"
line whatever happens. Only then tune on it like the others until it passes.

### 4. Save

`pnpm weave golden <runId> freelancer-workspace` and the same for the others.
Fill the README table: idea, stage, rounds, tokens in and out, cost.

## Done when

Gate **G1**: the freelancer workspace and the dashboard editor produce scope
and flows with zero mandatory issues within 3 rounds; the ecommerce store ran
once untuned and is recorded, then passes too;
`fixtures/golden/<idea>/01-scope.json` and `01-flows/04-reconcile.json` exist for every
idea.

## Watch out

- Golden files are committed; they are inputs to later tests.
- Costs: each idea run is a few cents; note the totals.
