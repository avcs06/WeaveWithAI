# 58 · T4 Golden freelancer workspace e2e green

Phase 9 · 45 min · Depends: T3 · Gate G7

## Goal

The freelancer workspace's generated tests pass, after bounded repairs if
needed, and the second benchmark table exists.

## What this step does

1. **Run the freelancer workspace through tests and repair.**
2. **Read the evidence**: every flow passing, repairs with their rounds.
3. **Send generator bugs back to their steps**, prompt problems to the
   prompts, nothing to the specs.
4. **Compare the two benchmark tables** and record the numbers.

After this step gate G7 is met.

## Implementation details

1. `pnpm weave run fixtures/ideas/freelancer-workspace.md --run <id> --to repair`
   (or `--from e2e` when the frontend is already built).
2. Read `06-e2e.md`: every flow passing; repairs listed with their rounds.
3. Failures that are generator bugs (owner `codegen`) go back to steps 37
   to 39 or 42; prompt problems to the session prompts; never to specs.
4. Read `05-benchmark.md` before and after repairs; note regressions.
5. Record e2e counts, repair rounds and session costs in
   `fixtures/golden/README.md`.

## Done when

Gate **G7**: the benchmark table exists for the freelancer workspace and every
generated e2e test passes after at most 2 repair rounds per screen.
