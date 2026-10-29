# 64 · FL10 Standard subflows

Phase 2 · 60 min · Depends: FL9 · Decisions: D2.8 B · Spec: OPTIONS.md D2.8

## Goal

Subflows every app has, written once and present in every catalog, so the
model reuses them by id instead of writing its own; a registry that
design-system subflows can join.

## What this step does

1. **A registry**, `src/config/subflows.ts`: `STANDARD_SUBFLOWS`, each a
   `Subflow` plus a `source` ('standard' or 'design-system') and a `use` line
   for the prompts. Standard ids have their own prefix, STD01, STD02, ...,
   so the model's SF01, SF02, ... never collide with them; FLOW-001 and
   CAT-003 accept a registry id where they require SF ids.
   `withStandardSubflows(doc)` puts them first in a document and drops a
   model-written copy of a standard id; `isStandardSubflowId(id)` says what
   is standard; `standardSubflowList()` is the prompt line.
2. **STD01 Confirm deletion**: one system step that asks; `confirm` deletes
   the record and hands back, `cancel` hands back with nothing deleted. The
   flow's deleting step runs STD01: its userAction is the user's choice to
   delete, its effects the delete, no websiteResponse (FLOW-004); FLOW-013 accepts a deleting step that runs a
   subflow with a confirm or cancel path, and its message names STD01. The
   prompt text never describes a standard subflow: each registry entry's
   `use` line travels with its id and name in the catalog message, and the
   validators say when one is required (user).
3. **The catalog stage** validates and stores the catalog with the standard
   subflows injected (`produce` gains `finish`), so references resolve and
   the model never needs to write them. The catalog message lists them; the
   catalog reviewer flags a rewritten standard subflow. A batch is validated with the whole catalog behind it,
   so a step that runs STD01 resolves, and issues inside the catalog's
   subflows are left out: they were the catalog's to fix.
4. **Renderer and fixtures**: standard subflows render as "(standard
   subflow)"; the reading-list fixtures use STD01, F05 runs it and deletes
   in the step after.

## Done when

```sh
pnpm test
pnpm typecheck
```

## Watch out

- A standard subflow carries no effects: the record is removed by the
  calling flow's next step, which names the nouns.
- Adding a design-system subflow is one entry with `source: 'design-system'`
  and an id DS01, DS02, ...; the rules accept any registry id.
