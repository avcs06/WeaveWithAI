# 77 · CD8 Frames

Phase 6 · 1 h · Depends: CD7 · Decisions: D9.1 A

## Goal

The `code-frames` stage builds every shell the design draws: its layout
and regions, the navigation, the frame changes per screen, and the
sign-in guard. It runs after shared, since a frame may use a shared piece.

## What this step does

1. **One session** builds every shell as a `layout.tsx` in a route group
   under `web/app/(routes)/`, one group per shell. The frame's parts (header,
   sidebar, navigation) go in `web/app/components/` (user, 2026-11-01).
2. **The navigation** comes from the design's IA: each item's label is its
   page's title, and it opens the page's route.
3. **Frame changes**: a screen whose frame differs from its shell's default
   gets the change the design describes.
4. **Signed-in screens** sit behind a guard that sends a visitor to sign
   in, through the session entity (CD4).
5. **Checks on a route**: `pnpm verify` and the rendered checks run on `/`
   and on one route per shell. These are the first browser checks of any
   shared piece a shell uses.

## Implementation details

- `src/agents/04code/04frames/stage.ts`: `framesStage`, one CD5 unit
  `code-frames`, writes the route groups' `layout.tsx` and
  `web/app/components/**`.
- `prompts/task.md` and `prompts/guidelines.md`: read `01-scaffold` to
  `04-frames`; the frame shows no page content; each page later fills the
  layout's main region.
- The starter route stays, so `verify /` has a page to render.

## Tests

1. With a fake `muse`: the unit writes its layouts and passes.
2. The unit's routes are `/` and one route per shell.

## Done when

```sh
pnpm typecheck && pnpm test
```

## Watch out

- Check early that MCP validate, lint and `pnpm verify` accept nested route
  groups. If they don't, the shells become layout components in
  `components/` that each page wraps itself in.
- CD5's design check reads a page's folder; with route groups that folder
  is `(routes)/(<group>)/<route>`.
