# 78 · CD9 Pages

Phase 6 · 1.5 h · Depends: CD8 · Decisions: D9.1 A, D7.1 B, D7.3 C

## Goal

The `code-pages` stage builds every page with its dialogs and its
single-use widgets, one session per page, one after another, each judged
by every check on its route.

## What this step does

1. **One unit per page**, in the order of the navigation, so the entry
   pages come first. Each unit is a CD5 runner, `code-pages-<screen>`.
2. **A page session** writes only the page's route folder (user,
   2026-11-01): `page.tsx`, and in `components/` beside it the page's own
   widgets, forms and dialogs. It imports the shared pieces and the entity
   layer and cannot change them.
3. **Every check runs on its route**: validate, typecheck, lint, the write
   paths, the design check (`data-testid`s and the operations its widgets
   read), `pnpm verify`, and the rendered checks DESIGN-R-001 to 009.
4. **After the last page**, `next build` runs once (CODE-008) and its issues
   are recorded as known.
5. **A bug in a shared piece** found on a page stays known for the MVP: a
   page session cannot fix it.

## Before you start

- FE8's task text and its gate: one page and its dialog in 6 minutes for
  $1.07.
- `screenExpect` (`src/engine/conformance.ts`) derives a page's node ids
  and operations.
- Nodes reach the session without `component`, which serves validation
  only; `size` and `look` come only on a node that overrides the theme's
  defaults, with its `overrideReason`.

## Implementation details

- `src/agents/04code/05pages/stage.ts`: `pagesStage`; units from the
  design's pages, each with `route`, `expect` and `writes` set to its route
  folder.
- `prompts/task.md`: build the page in `.weave/05-pages/<screen>/`; read
  `01-scaffold` to `04-frames` and that folder only.
- `prompts/guidelines.md` becomes `.weave/05-pages/guidelines.md`: the page
  fills the frame's main region; its own widgets, forms and dialogs go in
  `components/` beside `page.tsx`; shared ones come from `blocks/`; every
  state and alternative the page serves.

## Tests

1. With a fake `muse`: two pages run in order, each with its own write
   paths.
2. A page that edits `blocks/` fails CODE-004.
3. `next build` runs once, after the last page.

## Done when

```sh
pnpm typecheck && pnpm test
```

## Watch out

- Sessions run one after another: they share the app's git tree and
  `pnpm verify`'s port 3001.
