<!-- The rules for every coding session (CD2), written to .weave/01-scaffold/guidelines.md by the scaffold. Each stage's folder adds its own guidelines.md. No placeholders. -->
# Guidelines for every session

You build one part of a web app from its design, its flows and its
contract: the part your task names. The parts after yours import what you
build. When you finish, code checks your work, and two reviewers read your
change: one for clean, readable, well-organized code, one for whether it
builds what the design and the flows say. Follow every guideline here,
`AGENTS.md`, the guidelines of your stage's folder, and the instructions the
weave-design-system MCP gives when it connects.

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
  `get_component` for its props, their types and defaults, and whether a
  `data-testid` set on it reaches the page. Read a file in `packages/` only
  when neither answers your question, and then only that file, never a
  folder.
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
  node id, such as `data-testid="S04.n03"`. When `get_component` gives a
  component `passesHtmlAttributes: false`, put the test id on an element
  around it.
- Show the node's `text` as its words.
- Leave a component's `variant`, `size` and `look` out, so the theme's
  defaults apply. A node that sets one has an `overrideReason`: write that
  reason, in your own words, in a comment on the prop. "The design asks for
  it" is no reason; the MCP refuses it.
- Build every state its nodes list: empty, error, not found, denied.
- Forms use the Form recipe and show the flow's messages for invalid
  fields.
- A destructive action opens its confirm dialog. The operation runs only
  after the user confirms.
- A node with `navigatesTo` opens that screen's route from `routes.json`
  with `NextLink` or `useRouter`, even when that screen is not built yet.

## Keyboard and accessibility

The checks after your session load each page in a browser and hold it to
these. Build to them from the start. The design-system components meet them
already; a control you build yourself must too.

- Every control works by keyboard. Tab reaches it in reading order, its
  focus shows, and focus never gets stuck.
- Buttons act on Enter and Space. Use a design-system button or a native
  `button`, never a clickable `div`.
- A dialog closes on Escape and gives focus back to the control that opened
  it.
- Every control has an accessible name: its visible label, or `aria-label`
  when it shows only an icon.
- Text has a contrast of at least 4.5:1, or 3:1 for large text.
- Click and touch targets are at least 24 by 24 px.
- axe finds no serious or critical violation.

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
- Never install, add or remove a package (`pnpm install`, `pnpm add`): the
  app's packages are fixed. When a command fails because of the install,
  stop and say so in your summary.

## Finish

- The MCP validates every file you write right after you write it. Fix
  every finding.
- Then run `pnpm typecheck` and `pnpm nx lint web`, and the `pnpm verify`
  command your task names, when it names one. Fix until they pass.
- End with a summary in four parts:
  - `## Priorities`: each question and known issue, blocker or not, fixed
    or left.
  - `## Calls`: each design error you found and what you built instead.
  - `## Files`: the files you wrote.
  - `## Not built`: anything you could not build, and why.
