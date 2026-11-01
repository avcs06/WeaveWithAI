# 70 · CD1 App and theme

Phase 6 · 1.5 h · Depends: DS4a, FE8 · Decisions: D9.1 A, D3.4 B ·
Spec: specs/design.md "Theme" (THEME-003)

## Goal

The first stage of `04code`: the run's own app folder, made from the
template, with the run's theme applied by code and proven, the
design-system MCP built, the agent config written and a git baseline
committed.

## What this step does

1. **The stage group starts.** `src/agents/04code/01scaffold/` holds the
   `code-scaffold` stage. `PIPELINE` replaces `scaffold`, `codegen`,
   `apitest` and `frontend` with `code-scaffold`, `code-contract`,
   `code-shared`, `code-frames` and `code-pages`. Only `code-scaffold` is
   registered in this step.
2. **The app folder.** The template is copied into `runs/<id>/app` by its
   own generator, keeping the lockfile, and installed. The design-system
   MCP is built in the copy.
3. **The theme.** `applyTheme` writes the theme's colors, tokens, fonts and
   recipe defaults. A light-only or dark-only theme pins its mode, so the
   app never opens in the other one.
4. **The proof.** THEME-003 compares the app's `colors.ts` with the theme.
   A difference is a generator bug, so the stage throws.
5. **The agent config.** `prepareApp` (FE1) writes `.mcp.json`, the
   validate hook and the git baseline.
6. **The app's checks.** `pnpm typecheck`, `pnpm mcp:check` and
   `pnpm verify /` run at the end.

CD2 adds the `.weave/` folders to this stage, CD3 the agent's container.

## Before you start

- `scaffoldApp` is in `src/agents/02design/01theme/preview/storybook.ts`
  and `applyTheme` in `apply.ts` beside it. `weave app` uses both, into
  `apps/<slug>`, with `--skip-setup` and no MCP build.
- `template/tools/generate.mjs <source> <target> [--include-server] [--skip-setup]`.
  The frontend-only copy drops the root lockfile, so the install resolves
  fresh and slowly; `--include-server` keeps the lockfile.
- MCP: `pnpm mcp:setup`, then `pnpm mcp:check`, in the app.
- The color mode is chosen in `packages/ui/src/Root/UIRoot.tsx`. FE8's
  dark-only theme opened in light mode.
- `prepareApp(appDir)` is in `src/engine/setup.ts`.
- THEME-003 is reserved in `02design/01theme/validation/validation.ts`:
  "checks an applied app and comes with S1".

## Implementation details

```ts
// src/agents/04code/01scaffold/app.ts
export async function scaffoldApp(appDir: string): Promise<void>;   // moved from storybook.ts; keeps the lockfile, builds the MCP
export function applyTheme(appDir: string, theme: Theme): { changed: string[]; skipped: string[] };   // moved from apply.ts, plus the mode pin

// src/agents/04code/01scaffold/validation/rules/theme-003-applied.ts
export const theme003: Rule<{ colorsTs: string; theme: Theme }>;   // pure: the stage reads colors.ts and passes its text

// src/agents/04code/01scaffold/stage.ts
export const scaffoldStage: StageDef;   // name 'code-scaffold', produces []
```

- `weave app` imports `scaffoldApp` and `applyTheme` from the new place.
  `storybook.ts` keeps the story and the screenshots.
- The stage reads `design-theme` and `flows-scope`. It skips the copy when
  `runs/<id>/app` exists, so a rerun applies the theme again. Then
  `applyTheme`, THEME-003, `prepareApp`, and the three checks, each logged
  as a `check:run` event.
- Every file the stage writes goes into `.weave/ledger.json` with origin
  `code`.

## Tests

1. `applyTheme` on a temp copy pins a dark-only theme's mode.
2. THEME-003: a `colors.ts` from `applyTheme` passes; one with a changed
   shade fails.
3. The stage with fake checks runs them in order and fails on a failing
   one.
4. The `PIPELINE` order test follows the new names.

## Done when

```sh
pnpm typecheck && pnpm test
pnpm weave run fixtures/ideas/freelancer-workspace.md --run 20261101-0150-freelancer-workspace --from code-scaffold --to code-scaffold
```

The app's `pnpm typecheck`, `pnpm mcp:check` and `pnpm verify /` pass, and
its `colors.ts` holds the theme's colors. The run makes no model calls, but
ask before it.

## Watch out

- The app needs a real copy of the MCP, not the template's symlink.
- `weave app`'s `apps/` folder stays as it is.
