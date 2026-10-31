# 43 · FE3 New components

Phase 7 · 60 min · Depends: FE1, FE2 · Decisions: D3.1 B, D3.10 A · Spec:
specs/design.md "New components"; `template/packages/ui/AGENTS.md`

## Goal

Every component the design declared and the design system lacks, built by
a model session under the DS conventions, with an axe test, before any
page uses it.

## What this step does

1. **For every new component the design declared**, one model session builds
   it in its own folder under `web/app/components/`, following the design
   system's conventions (types file, styles with tokens, data-slot parts,
   data attributes for states, accessible by keyboard) and the recipes of the
   components it builds on.
2. **It also writes the component's test** (behaviour and axe) and a recipe,
   so the page sessions can use it the way they use design-system parts.
3. **Checks** must pass before the session counts: validate, typecheck,
   lint, the test.
4. **The `frontend` stage is registered** here and grows in the next steps.

After this step every component a page needs exists and is tested, before
any page is written.

## Implementation details

### `src/agents/frontend/components.ts`

```ts
export async function buildNewComponents(ctx: StageContext, inv: Inventory, screens: Screens): Promise<SessionResult[]>;
export function componentTask(c: NewComponent, inv: Inventory, run: Run): string;   // pure, tested
```

For each `screens.newComponents` entry, one session:

- `id: 'component:<Name>'`, `allowWrite: ['web/app/components/<Name>/**']`
  (this includes its own test file, which is the one place a model may
  write a test), origin `model`.
- Task text: the component's spec (purpose, closest existing and why not,
  composed of, parts, props, states, keyboard, ARIA pattern, screens);
  the DS conventions (`template/packages/ui/AGENTS.md`, read at run time);
  the recipes of every `composedOf` DS component; the styling rules from
  the MCP instructions; the files to produce:
  `<Name>.tsx`, `<Name>.types.ts`, `<Name>.css.ts` (tokens from
  `@packages/styles/tokens.css`, `data-slot` on parts, `data-*` states),
  `index.ts`, `<Name>.recipe.tsx` (one usage case so step 44 can read it),
  `<Name>.test.tsx` (`@testing-library/react` render, `axe` from `jest-axe`
  on each state, keyboard behaviour from the spec's keyboard map).
- `checksAtEnd`: `validate` (the folder), `typecheck`, `lint` (the
  folder), `test` with pattern `components/<Name>`.

Register the `frontend` stage now (`src/agents/frontend/stage.ts`): it
runs `generatePages` (step 42), then `buildNewComponents`, then step 44's
pages, then step 45's checks; later steps extend `run`.

### Tests

`componentTask` output contains the ARIA pattern, every part name and the
recipe text of a `composedOf` component (fixture inventory).

## Done when

```sh
pnpm weave run fixtures/ideas/dashboard-editor.md --run <id> --to frontend   # stops after components until step 44 lands; the session ends 'done'
cd runs/<id>/app && pnpm nx test web -- --testPathPattern components       # the new component's test passes
```

For an idea with no new components the step is a no-op.

## Watch out

- A session that can't get its test green within the turn budget ends
  `checks`; the stage reports it and continues, and the page session (step
  44) will see the component as it is. Don't loosen the budget silently.
