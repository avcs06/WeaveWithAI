# Guidelines for building a screen

Follow every guideline here, `AGENTS.md`, and the instructions the
weave-design-system MCP gives when it connects.

## Read first

- The task names a screen file in `.weave/screens/`. It holds the page and
  its dialogs: their sections, the widget each section places, and the
  nodes inside each widget. A node says what it is (`what`, `component`,
  `role`), its words (`text`, `label`), its heading level, the values it
  shows (`data`, as `Noun.attribute`), the flow steps it serves, the states
  it shows in (`states`), and the screen it opens (`navigatesTo`).
- `.weave/flows.json` holds the steps and alternatives the screen serves.
  A step says what the user does and what the website shows. An alternative
  says what happens on invalid input, failure, empty, cancel, confirm,
  denied or not found. Build every one of them.
- `.weave/contract.json` holds the entities, the operations, and for each
  widget the operations that load its data (`widgets[].reads`).

## Data

- There is no API yet. Make each entity the screen needs in
  `web/app/entities/<entity>/`: its type from the contract's fields plus
  `id`, `createdAt` and `updatedAt`; four to six realistic seed records; a
  store made with `createStore` from `@packages/utils/state`; and one
  function or hook per contract operation, named after it (`listDashboards`,
  `createDashboard`, `deleteDashboard`).
- The page gets and changes data only through these. A widget loads its
  data through the operations its contract entry `reads`.

## Building

- The page goes in `web/app/(routes)/<route>/page.tsx`, with its page-only
  components beside it. Its dialogs go in the same folder.
- Every node becomes an element. Give the node's root element
  `data-testid` set to the node id, such as `data-testid="S04.n03"`.
- Show the node's `text` as its words. The node with heading level 1 is the
  page's H1.
- Build every state the screen and its nodes list: loading, empty, error,
  not found, denied. Show what the flow says the website shows in each.
- Forms use the Form recipe and show the flow's messages for invalid
  fields.
- A destructive action opens the design's confirm dialog. The operation
  runs only after the user confirms.
- A node with `navigatesTo` opens that screen's route with `NextLink` or
  `useRouter`, even when that screen is not built yet.
- There is no sign-in yet. Render the page as a signed-in user sees it.
- The page frame (header, navigation) is not part of the task.

## Never

- Never write or change a test.
- Never change `packages/`, `tools/`, `.weave/`, `.muse/` or a config file.

## Finish

- Every file you write is validated by the MCP after you write it. Fix
  every finding it reports.
- Then run `pnpm typecheck`, `pnpm nx lint web` and `pnpm verify <route>`,
  and fix until all three pass.
- End with a short summary: the files you wrote, and anything you could
  not build.
