# Guidelines for every session

You build one part of a web app from its design, its flows and its
contract: the part your task names. The parts after yours import what you
build. When you finish, code checks your work, and two reviewers read your
change: one for clean, readable, well-organized code, one for whether it
builds what the design and the flows say, and puts first what the user
came for. Follow every guideline here,
`AGENTS.md`, the guidelines of your stage's folder, and the instructions the
weave-design-system MCP gives when it connects.

## Read first

- Read your task first. Then read this file, then the `guidelines.md` of
  each folder your task names, in number order. Read only the folders your
  task names.
- Read `UX.md` at the app's root: the practices every screen follows. Build
  to them; the reviewers hold your change to them.
- In `01-scaffold/`, read `guidelines.md`, `routes.json`, `issues.json` and
  `recipes.md`. Your own folder holds your part of the flows, the design and
  the contract. Look something up in `flows.json`, `contract.json`,
  `scope.json` or `theme.json` only when your folder does not have it, and
  read only that part (search for its id), never the whole file.
- The design is prose. Each frame, screen and dialog lists what the user
  sees and can do there as numbered steps, in reading order, then its
  alternatives: what it shows in other situations, such as an empty list or
  a record that is gone. Steps name fields (FD03), forms (FM01), dialogs
  (D01), routes (/books/[bookId]) and flows (F05) by their ids.
- A flow step says what the user does and what the website shows. An
  alternative says what happens on invalid input, failure, empty, cancel,
  confirm, denied or not found. Build every one that your task asks for.

## Reading

- Every file you read stays in your context for the rest of the session and
  is paid for again on every step. Read only what your task needs.
- Before you use a component, call `get_recipe` for it: its cases are the
  supported usage, and the one that fits is what you copy. A file you write
  that imports a component whose recipe you have not asked for in this
  session is refused; ask for the recipe, then write the file to it. Call
  `get_component` for its props, their types and defaults. Read a file in
  `packages/` only when neither answers your question, and then only that
  file, never a folder.
- `recipes.md` lists every recipe with what it is for: the design-system
  components' and the state and hook recipes. Never read `packages/ui` or
  `packages/recipes` for them.
- Token names, and the class that applies each, come from `list_tokens` and
  `search_tokens`. Never read `tokens.ts`, `colors.ts`, the Tailwind config
  or `tools/`.

## Data

- Get and change data only through `web/app/entities/`; `02-contract/`
  says how.
- A screen loads its records through the operations its file names.
- When a screen needs an operation or a field the entity layer lacks, add
  it there, written like the ones beside it, and list it in your summary.

## Layout and emphasis

The design says what each screen holds and in what order; you decide how it
looks. Build every screen to the practices in `UX.md`, so a user sees at a
glance what it is for:

- What the user came for comes first and stands out. The step order is the
  reading order and the order of importance: the title and the first steps
  are the most prominent, later steps are quieter.
- One main action per view, as the primary button. Other actions are
  secondary, or sit in a menu when there are many.
- What belongs together sits together: a record's fields in one section,
  and a list's search, filters and add action together above the list.
- Everything lines up on one left edge and one grid. Spacing comes from the
  tokens: more space between groups than inside a group.
- Records the user compares go in a table; records the user opens one by
  one go in cards or a list.
- Text lines stay short enough to read, and nothing crowds the screen at
  desktop width.
- Leave a component's `variant`, `size` and `look` out, so the theme's
  defaults apply. When the emphasis needs another, write your reason in a
  comment on the prop. "The design asks for it" is no reason; the MCP
  refuses it.

## Building

- Build every step and every alternative, in the order the design gives
  them.
- Loading and a failed load look the same on every screen: show the
  loading state while records load, and an error with a retry when loading
  fails.
- Every form is the `Form` component, its fields under `Controller`, as the
  Form recipe shows: it lays out the fields, the form's error and the
  actions, and sets the fields' widths. Show the flow's messages for invalid
  fields.
- A destructive action opens its confirm dialog. The operation runs only
  after the user confirms.
- A step that leads to a route opens it from `routes.json` with `NextLink`
  or `useRouter`, even when that screen is not built yet.
- Use the words the design quotes exactly as they are. Write every other
  word for this app, in the voice the brief in `theme.json` names: never
  placeholder text or words that would fit any app.
- The app is built for desktop screens only: write no phone layout.

## Keyboard, accessibility and spacing

The checks after your session load each page in a browser and hold it to
these. Build to them from the start. The design-system components meet them
already; a control you build yourself must too.

- Every control works by keyboard. Tab reaches it in reading order, its
  focus shows, and focus never gets stuck.
- Buttons act on Enter and Space. Use a design-system button or a native
  `button`, never a clickable `div`.
- A dialog closes on Escape and gives focus back to the control that opened
  it. No check tries this, so use the design system's dialog, which does both.
- Every control has an accessible name: its visible label, or `aria-label`
  when it shows only an icon.
- Text has a contrast of at least 4.5:1, or 3:1 for large text.
- Click and touch targets are at least 24 by 24 px, and two controls sit
  at least 8 px apart.
- A container's gap is at most the gap of the container around it, and its
  padding is at least its own gap.
- axe finds no serious or critical violation.

## When the design is wrong

- The design may hold errors: a missing alternative, a wrong word, an
  action that leads nowhere, a step no flow needs.
- When something is wrong, make your own call. Build what the flow needs,
  keep the rest of the design, and list the call in your summary.

## Questions and known issues

- `issues.json` in your folders lists questions with their answers, and
  the issues earlier stages left. Rank them before you build.
- A blocker stops a flow step from working, shows wrong data or wrong
  words, or breaks a check. Fix only blockers, and say which you left.
  For a blocker you left, say why your part cannot fix it.

## Never

- Never write or change a test.
- Never change `packages/`, `tools/`, `.weave/`, `.muse/` or a config file.
- Never install, add or remove a package (`pnpm install`, `pnpm add`): the
  app's packages are fixed. When a command fails because of the install,
  stop and say so in your summary.

## What done looks like

- Every screen your task names works end to end with the seed data: lists
  show records, forms save and show the result, and each alternative shows
  when its situation happens.
- Every screen looks finished: what the user came for first, one primary
  action per view, everything aligned and spaced from the tokens.
- The checks below pass.

## Finish

- The MCP validates every file you write right after you write it. Fix
  every finding.
- Then run `pnpm typecheck` and `pnpm nx lint web`, and the `pnpm verify`
  command your task names, when it names one. Fix until they pass.
- End with a summary in four parts:
  - `## Priorities`: each question and known issue, blocker or not, fixed
    or left, and why for each blocker you left.
  - `## Calls`: each design error you found and what you built instead.
  - `## Files`: the files you wrote.
  - `## Not built`: anything you could not build, and why.
