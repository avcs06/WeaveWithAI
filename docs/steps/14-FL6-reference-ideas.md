# 14 · FL6 Reference ideas

Phase 2 · 60 min · Depends: FL5 · Decisions: D12.1 · Spec: specs/flows.md
"Done when"

## Goal

Prompts tuned on three ideas, one unseen idea run untouched, and golden
artifacts saved for every later stage to develop offline. Gate G1.

## What this step does

1. **A `weave golden` command** copies a run's accepted artifacts into
   `fixtures/golden/<idea>/` and prints the rounds, tokens and cost.
2. **Tune on three ideas** (project tracker, dashboard editor, appointment
   booking): read each flows markdown as a spec reviewer, fix the prompt for
   anything you'd reject, rerun. Validators are never touched.
3. **Run the unseen idea once** (client notes) without tuning on it, and
   record the result either way: it is the honest test.
4. **Save the accepted artifacts** and fill the README table.

After this step later stages can be developed offline on real, accepted
flows, and gate G1 is met.

## Implementation details

### 1. `weave golden` command

Add to `src/cli.ts`: `golden <runId> <ideaName> [--stages scope,flows]`
copies the named artifacts from the run to `fixtures/golden/<ideaName>/`
(same file names) and prints the rounds, tokens and cost per stage from the
run's events so the README table can be filled.

### 2. Tuning loop (project tracker, dashboard editor, appointment booking)

For each idea: `pnpm weave run fixtures/ideas/<idea>.md --to flows`. Read
`01-flows.md` fully. Fix the prompt for anything you would reject in a spec
review: missing alternatives, vague website responses, fields without
examples, flows that should exist (sign out, search where lists grow). Rerun
with `--from scope` or `--from flows` as needed; the replay cache makes
unchanged calls free. Never touch `validate.ts`; if a rule is wrong, add a
task in PLAN.md and stop for the user.

### 3. The unseen test

Run `fixtures/ideas/client-notes.md` once with the tuned prompts. Record the
result in `fixtures/golden/README.md` under a "Client notes, untuned" line
whatever happens. Fix prompts for a failure only if the same failure shows
on at least one tuning idea.

### 4. Save

`pnpm weave golden <runId> project-tracker` and the same for the others
(including client notes if it passed). Fill the README table: idea, stage,
rounds, tokens in and out, cost.

## Done when

Gate **G1**: the three tuning ideas produce scope and flows with zero
mandatory issues within 3 rounds; client notes ran once and is recorded;
`fixtures/golden/<idea>/01-scope.json` and `01-flows.json` exist for every
idea that passed.

## Watch out

- Golden files are committed; they are inputs to later tests.
- Costs: each idea run is a few cents; note the totals.
