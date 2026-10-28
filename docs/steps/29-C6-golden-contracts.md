# 29 · C6 Contracts for every golden idea

Phase 4 · 40 min · Depends: C5 · Spec: specs/contracts.md "Done when"

## Goal

A contract for every golden flow set, tuned on all but client notes. Gate G3.

## What this step does

1. **Run the contract stage for every golden idea**, tuning the prompt only.
2. **Appointment booking is the business-rule test**: it must raise a
   question about slot availability rather than invent the rule.
3. **The unseen idea runs once, untuned.** Save, fill the README table.

After this step gate G3 is met.

## Implementation details

1. `pnpm weave run … --run <id> --to contract` per idea.
2. Read every `03-contract.md`: entity per noun, fields that match the
   flows' fields, operations per step, sensible seeds. Tune `prompt.md`
   only.
3. Appointment booking is the business-rule stress test: expect at least one
   `needsRule` with a question (slot availability); don't tune it away.
4. Client notes once, untuned, recorded.
5. `pnpm weave golden <runId> <idea> --stages contract`; README table.

## Done when

Gate **G3**: every golden idea has `03-contract.json` with zero mandatory
issues, produced in parallel with design; every seed row validates and
every invalid example fails.
