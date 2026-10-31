# 23 · DS9 Design for every golden idea

Phase 3 · 60 min · Depends: DS8 · Spec: specs/design.md "Done when"

## Goal

Design artifacts for every golden flow set, prompts tuned on all but the
ecommerce store's first run, golden `02-*` saved. Gate G2.

## What this step does

1. **Run the design stage on every golden flow set**, reusing the Phase 2
   run folders.
2. **Tune the IA and nodes prompts** on what you'd reject; never the rules.
3. **The dashboard editor must declare a new component** with reasons (the
   widget canvas); if it doesn't, the prompt's wording about when to declare
   one is adjusted, not the budget.
4. **The unseen idea runs once, untuned.** Save the accepted artifacts, fill
   the README table.

After this step gate G2 is met and the contract and reconciliation stages
can be developed offline.

## Implementation details

1. For each idea with golden flows: `pnpm weave run fixtures/ideas/<idea>.md
   --to design` (the flows stage replays or is skipped as done; use `--run
   <id>` of the Phase 2 run to reuse its folder).
2. Read every `02-design/09-assemble.md`. Tune `prompt-ia.md` and `prompt-nodes.md` for
   what you'd reject: screens that don't serve their steps, sections with no
   purpose, nodes with placeholder text, components used against their
   recipe's "when not to use". Never touch `validate.ts`.
3. The dashboard editor must declare at least one new component with
   reasons (a widget canvas or widget frame is the expected one). If it
   doesn't, adjust the IA prompt's wording about when to declare one, not
   the budget.
4. Ecommerce store: run once untuned, record; then tune on it too.
5. `pnpm weave golden <runId> <idea> --stages brief,theme,screens` for each;
   fill the README table.

## Done when

Gate **G2**: every golden idea has `02-design/01-brief.json`, `02-design/02-theme.json`,
`02-design/09-assemble.json` with zero mandatory issues; `02-design/09-ds-gaps.json` for the
dashboard editor lists at least one new component.
