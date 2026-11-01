# 76 · CD7 Shared

Phase 6 · 1 h · Depends: CD4, CD6 · Decisions: D9.1 A, D3.10 A

## Goal

The `code-shared` stage builds what more than one screen uses, before any
frame or page needs it: every new component, then every widget placed on
two or more screens.

## What this step does

1. **One session** builds the new components first, then the shared
   widgets, which may use them.
2. **New components** go in `web/app/components/<Name>/` with the DS
   conventions, and no test (user, 2026-11-01).
3. **Shared widgets** go in `web/app/blocks/<Widget>/`. They take their data
   through the entity layer and the operations their contract entry reads.
4. **Skipped when nothing is shared.** In the golden sets the freelancer
   workspace shares W01 (a page header on six pages) and W29 (a delete
   confirm on five dialogs); every idea has two or three new components.
5. **No route yet**, so the checks that need one wait for frames and pages.
   Validate, typecheck, lint, the write paths and the `data-testid`s run.

## Implementation details

- `src/agents/04code/03shared/stage.ts`: `sharedStage`, one CD5 unit
  `code-shared`, writes `web/app/components/**` and `web/app/blocks/**`.
- `prompts/task.md`: build the components in `.weave/03-shared/components/`,
  then the widgets in `.weave/03-shared/widgets/`; read `01-scaffold` to
  `03-shared`.
- `prompts/guidelines.md` becomes `.weave/03-shared/guidelines.md`: the
  write paths, a widget's props for the screen-specific parts (its slots),
  and that pages will import these and cannot change them.

## Tests

1. With a fake `muse`: the unit writes its paths and passes.
2. A unit is skipped when no component or shared widget exists.

## Done when

```sh
pnpm typecheck && pnpm test
```

## Watch out

- A shared widget's slots are where screens differ (DESIGN-046): build
  them as props, not as one screen's content.
