<!-- The rules for every coding session (CD2), written to .weave/01-scaffold/guidelines.md by the scaffold. Each stage's folder adds its own guidelines.md. No placeholders. -->
# Guidelines for every session

Follow every guideline here, `AGENTS.md`, the guidelines of your stage's
folder, and the instructions the weave-design-system MCP gives when it
connects.

## Read first

- Read your task first. Then read this file, then the `guidelines.md` of
  each folder your task names, in number order. Read only the folders your
  task names.
- In `01-scaffold/`, read `guidelines.md`, `routes.json`, `issues.json` and
  `recipes.md`. Your own folder holds your part of the flows, the design and
  the contract. Look something up in `flows.json`, `contract.json`,
  `scope.json` or `theme.json` only when your folder does not have it, and
  read only that part (search for its id), never the whole file.
- In a design file, a node says what it is (`what`, `component`, `role`),
  its words (`text`, `label`), its heading level, the values it shows
  (`data`, as `Noun.attribute`), the flow steps it serves, the states it
  shows in (`states`), and the screen it opens (`navigatesTo`).
- A flow step says what the user does and what the website shows. An
  alternative says what happens on invalid input, failure, empty, cancel,
  confirm, denied or not found. Build every one that your task asks for.

## Reading

- Every file you read stays in your context for the rest of the session and
  is paid for again on every step. Read only what your task needs.
- For each component you use, call `get_recipe` for its cases and
  `get_component` for its props, their types and defaults. Read a file in
  `packages/` only when neither answers your question, and then only that
  file, never a folder.
- `recipes.md` lists the state and hook recipes with what each is for. Call
  `get_recipe` for the ones you use; never read `packages/recipes`.
- Token names, and the class that applies each, come from `list_tokens` and
  `search_tokens`. Never read `tokens.ts`, `colors.ts`, the Tailwind config
  or `tools/`.

## Data

- Get and change data only through `web/app/entities/`; `02-contract/`
  says how. Never change `entities/`, unless a blocker needs it; then name
  the blocker in your summary.
- A widget loads its data through the operations its contract entry
  `reads`.

## Building

- Every node is an element. Give its root element `data-testid` set to the
  node id, such as `data-testid="S04.n03"`.
- Show the node's `text` as its words.
- Leave a component's `variant`, `size` and `look` out, so the theme's
  defaults apply. A node that sets one has an `overrideReason`: write that
  reason, in your own words, in a comment on the prop. "The design asks for
  it" is no reason; the MCP refuses it.
- Build every state its nodes list: loading, empty, error, not found,
  denied.
- Forms use the Form recipe and show the flow's messages for invalid
  fields.
- A destructive action opens its confirm dialog. The operation runs only
  after the user confirms.
- A node with `navigatesTo` opens that screen's route from `routes.json`
  with `NextLink` or `useRouter`, even when that screen is not built yet.

## When the design is wrong

- The design may hold errors: a missing state, a wrong word, a control that
  opens nothing, a step no control serves, a box that cannot fit.
- When something is wrong, make your own call. Build what the flow needs,
  keep the rest of the design, and list the call in your summary.

## Questions and known issues

- `issues.json` in your folders lists questions with their answers, and
  the issues earlier stages left. Rank them before you build.
- A blocker stops a flow step from working, shows wrong data or wrong
  words, or breaks a check. Fix only blockers, and say which you left.

## Never

- Never write or change a test.
- Write only inside the paths your stage's guidelines name, and in
  `entities/` only for a blocker.
- Never change `packages/`, `tools/`, `.weave/`, `.muse/` or a config file.

## Finish

- The MCP validates every file you write right after you write it. Fix
  every finding.
- Then run `pnpm typecheck` and `pnpm nx lint web`, and `pnpm verify
  <route>` when your task names a route. Fix until they pass.
- End with a summary in four parts:
  - `## Priorities`: each question and known issue, blocker or not, fixed
    or left.
  - `## Calls`: each design error you found and what you built instead.
  - `## Files`: the files you wrote.
  - `## Not built`: anything you could not build, and why.
