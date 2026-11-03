# Guidelines for every session

You build the unit of a web app that your task names, from its design, its
flows and its contract. The units after yours import what you build. When
you finish, code checks your work, and four reviewers read your change.
One judges whether your code is clean, readable and well organized. One
judges whether your change builds what the design and the flows say. One
judges whether it works: its state, what it does when the user acts or
something fails, and what it lets a visitor do. One judges how each screen
presents its content: its columns and rows, what sits beside what, what
stands out, and anything left dangling or there for no reason. Follow every
guideline in this file, in `AGENTS.md` and in your stage's folder. Also
follow the instructions the weave-design-system MCP gives when it connects.

## Read first

- Read your task first. Then read this file, then the `guidelines.md` of
  each folder your task names, in number order. Read only the folders your
  task names.
- Read `UX.md` at the app's root. It holds the practices every screen
  follows. Build to them. The reviewers hold your change to them.
- In `01-scaffold/`, read `guidelines.md`, `routes.json`, `issues.json` and
  `recipes.md`. Your own folder holds what your task needs from the flows,
  the design and the contract. Look something up in `flows.json`,
  `contract.json`, `scope.json` or `theme.json` only when your folder does
  not have it. Then search for its id, and read only that entry, never the
  whole file.
- The design is prose. Each frame, screen and dialog lists what the user
  sees and can do there, as numbered steps in reading order. Then come its
  alternatives, which say what it shows in other situations, such as an
  empty list or a record that is gone. Steps name fields (FD03), forms
  (FM01), dialogs (D01), routes (/books/[bookId]) and flows (F05) by their
  ids.
- A flow step says what the user does and what the website shows. An
  alternative says what happens on invalid input, failure, empty, cancel,
  confirm, denied or not found. Build every step and every alternative
  your task asks for.

## Reading

- Every file you read stays in your context for the rest of the session.
  It is paid for again on every turn. Read only what your task needs.
- Before you use a component, call `get_recipe` for it. Its cases are the
  supported usage. Copy the case that fits. When a file you write imports
  a component whose recipe you have not asked for in this session, the
  write is refused. Then ask for the recipe, and write the file again to
  follow it. Call `get_component` for the component's props, their types
  and defaults. Read a file in `packages/` only when neither answers your
  question. Then read only that file, never a folder.
- `recipes.md` lists every recipe and what it is for. It has the recipes
  of the design-system components, and the state and hook recipes. Never
  read `packages/ui` or `packages/recipes` for them.
- Token names, and the class that applies each, come from `list_tokens` and
  `search_tokens`. Never read `tokens.ts`, `colors.ts`, the Tailwind config
  or `tools/`.

## Data

- Get and change data only through `web/app/entities/`. `02-contract/`
  says how.
- A screen loads its records through the operations its file names.
- When a screen needs an operation or a field the entity layer lacks, add
  it there. Write it like the ones beside it, and list it in your summary.

## Layout and emphasis

The design says what each screen holds and in what order. You decide how
it looks. Build every screen to the practices in `UX.md`, so a user sees at
a glance what it is for:

- What the user came for comes first and stands out. The step order is the
  reading order and the order of importance. The title and the first steps
  are the most prominent. Later steps are quieter.
- A screen is not always one column. Before you build a screen, read what
  it holds. Then pick the layout that suits it: one column, two columns, or
  a main column with a side column. The first steps go in the first column.
  For example, a product page puts its photos in the left column, and its
  name, price, options and main action in the right one. A checkout keeps
  its order summary in a side column beside the form. A patient's page
  keeps the next visit and its actions in a side column beside the
  history.
- One main action per view, as the primary button. Other actions are
  secondary, or sit in a menu when there are many.
- What belongs together sits together. A record's fields sit in one
  section. A list's search, filters and add action sit together above the
  list.
- Everything lines up on one left edge and one grid. Spacing comes from the
  tokens. Leave more space between groups than inside a group.
- A list of records is a `Table` or a `CardList`, and nothing else. A
  `Table` holds records the user scans and compares. A `CardList` holds
  rich records the user opens one by one.
- Text lines stay short enough to read, and nothing crowds the screen at
  desktop width.
- Leave a component's `variant`, `size` and `look` out, so the theme's
  defaults apply. When the emphasis needs another value, write your reason
  in a comment on the prop. "The design asks for it" is no reason, and the
  MCP refuses it.

## Presentation

Every element sits where the user looks for it and earns its place. A
reviewer holds each screen to these rules.

- A link or button sits with what it acts on or leads from. A link to a
  record sits on its row, card or name. A record's actions sit with the
  record or in the `PageHeader`. Never leave a link or button alone after
  the content, between two sections or in a row of its own, such as "Back
  to the list" under a record's details.
- The way up to a list or a parent is the breadcrumb. A screen the frame's
  navigation lists is reached through that navigation. Neither shows again
  as a link or button of its own.
- After a task is done, such as a save or an order, offer one main next
  step and at most one way out, in one row with the result.
- Each destination and each action appears once in a view.
- Related buttons, such as Edit and Remove, or Save and Cancel, sit side by
  side in one row.
- A note, total, count or status sits beside what it describes.
- Every heading, section and card holds something. Wrap no single element
  in a frame it does not need.
- Every word helps the user act. Write no line that describes the screen to
  itself, such as "This page shows your orders". Help text never repeats
  its label, and a status shows once.
- Add nothing only to decorate or fill space. Each badge, tag, icon, border
  and card tells the user something they need here.

## Building

- Build every step and every alternative, in the order the design gives
  them.
- Loading and a failed load look the same on every screen. Show the
  loading state while records load. Show an error with a retry when
  loading fails.
- Every form is the `Form` component, with its fields under `Controller`,
  as the `Form` recipe shows. `Form` lays out the fields, the form's error
  and the actions, and sets the fields' widths. Show the flow's messages
  for invalid fields.
- A destructive action opens its confirm dialog. The operation runs only
  after the user confirms.
- A step that leads to a route opens it with `NextLink` or `useRouter`,
  even when that screen is not built yet. Take the route from
  `routes.json`.
- Use the words the design quotes exactly as they are. Write every other
  word for this app, in the voice the brief in `theme.json` names. Never
  write placeholder text or words that would fit any app.
- The app is built for desktop screens only. Write no phone layout.

## Behavior

The app keeps working when the user acts and when something fails. A
reviewer holds your code to these rules.

- Work out a value that follows from records or other state, such as a
  total or a filtered list, while rendering. Never keep it in state synced
  by an effect, and never copy a hook's records into state.
- Keep what must outlive the view in the entity layer's store. Keep what
  belongs to one view, such as an open dialog or a filter, in that view.
- After a save, every screen and frame part that shows the record shows
  the new value without a reload.
- An action that saves, changes or removes records waits for its operation
  and reacts to the outcome. A second press while it runs does nothing.
- Every effect lists what it reads and cleans up what it starts, such as a
  timer or a listener. No effect sets the state that sets it off again. A
  load that finishes after the user moved on never shows on the new view.
- A list item's key comes from its record, never its index.
- Handle an empty list, an empty optional field, zero, one item and a long
  name. Check a record that may be missing before you read its fields.
- A change across several records happens in full, or tells the user what
  did not happen.
- Round money once, when you show it, so a total equals the sum of its
  lines. Keep each quantity within its limits, such as above zero.
- Compare dates as dates, never as text. Store a date the user picks as
  the day they picked.
- Never set text a user typed or a record holds as HTML. A link or image
  address from a user or a record opens only an `http`, `https` or app
  address. A path from the URL, such as where to go after sign-in, leads
  only to a route of this app.
- Never write a password, card number or other secret to browser storage,
  a log or the URL, and never show one back.
- A signed-in page shows and changes only what the user's role may. A
  member sees their own records.

## Keyboard, accessibility and spacing

The checks after your session load each page in a browser and hold it to
these rules. Build to them from the start. The design-system components
meet them already. A control you build yourself must meet them too.

- Every control works by keyboard. Tab reaches it in reading order, its
  focus shows, and focus never gets stuck.
- Buttons act on Enter and Space. Use a design-system button or a native
  `button`, never a clickable `div`.
- A dialog closes on Escape and gives focus back to the control that opened
  it. No check tries this, so use the design system's dialog, which does
  both.
- Every control has an accessible name: its visible label, or `aria-label`
  when it shows only an icon.
- Text has a contrast of at least 4.5:1, or 3:1 for large text.
- Click and touch targets are at least 24 by 24 px. A smaller one passes
  inside a sentence, or when no other target comes within 12 px of its
  center. Two controls sit at least 8 px apart.
- A container's gap is at most the gap of the container around it. Its
  padding is at least its own gap.
- A number that stands alone, such as a count, a total or a statistic, is a
  `Numeral`. A number inside a sentence stays plain text.
- Every screen's H1 is its `PageHeader` title, so all titles look alike. On
  the landing page, it is the `Hero` headline.
- Every section of a page starts on the page container's left edge. A page
  adds no padding, margin or max width of its own.
- A label sits beside its value, never at the far end of a wide row.
- A grid of a fixed set has a column count that divides it, so no item sits
  alone in the last row.
- axe finds no serious or critical violation.

## When the design is wrong

- The design may hold errors, such as a missing alternative, a wrong word,
  an action that leads nowhere, or a step no flow needs.
- When something is wrong, make your own call. Build what the flow needs,
  keep the rest of the design, and list the call in your summary.

## Questions and known issues

- `issues.json` in your folders lists questions with their answers, and
  the issues earlier stages left. Rank them before you build.
- A blocker stops a flow step from working, shows wrong data or wrong
  words, or breaks a check. Fix only blockers, and say which you left.
  For a blocker you left, say why your unit cannot fix it.

## Never

- Never write or change a test.
- Never change `tools/`, `.muse/` or a config file. A session that changes
  one fails.
- Never install, add or remove a package (`pnpm install`, `pnpm add`). The
  app's packages are fixed. When a command fails because of the install,
  stop and say so in your summary.

## Change with care

These are yours to change, but every screen depends on them:

- the design system in `packages/`
- `PageLayout`, `PageHeader`, `Hero`, `NotFound`, `PageLogo` and
  `UserMenu` in `web/app/components/`
- the entity layer in `web/app/entities/`
- each frame's `layout.tsx`, which code wrote

Leave them as they are unless an issue needs a change there and your own
code cannot fix it. Then change only what the issue needs, and keep every
other screen that uses it working.

## What done looks like

- Every screen your task names works end to end with the seed data. Lists
  show records, and forms save and show the result. Each alternative shows
  when its situation happens.
- Every screen looks finished. What the user came for comes first, and
  each view has one main action. Everything is aligned and spaced from the
  tokens.
- The checks below pass.

## Finish

- The MCP validates every file you write right after you write it. Fix
  every finding.
- Then run `pnpm typecheck` and `pnpm nx lint web`. When your task names a
  `pnpm verify` command, run it too. Fix until they pass.
- End with a summary in four parts:
  - `## Priorities`: each question and known issue, whether it is a
    blocker, and whether you fixed or left it. For each blocker you left,
    say why.
  - `## Calls`: each design error you found and what you built instead.
  - `## Files`: the files you wrote.
  - `## Not built`: anything you could not build, and why.
