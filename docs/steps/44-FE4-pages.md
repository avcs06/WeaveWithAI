# 44 · FE4 Pages: sections wired to hooks

Phase 7 · 2.5 h · Depends: FE3 · Decisions: D3.6 C, D7.1 A, D7.2 A, D7.3 C,
D7.4 · Spec: specs/design.md "Screens", "Rendered checks"

## Goal

Every screen filled in by a model session: the sections and nodes from the
design, built from recipes and the generated hooks, with loading, empty,
error, invalid and submitting states, verified by the app's own checks.

## What this step does

1. **One model session per screen** (its dialogs included) fills the shell's
   sections from the design: the nodes, in the design's voice, with the
   design-system recipes and the new components.
2. **Data comes only from the generated hooks**; the session is given the
   hook and schema files verbatim so names and types are exact. Loading,
   empty, error, invalid and submitting states are required; forms follow the
   Form recipe and show field errors from the API.
3. **The session may write only inside its route folder**; shared pieces are
   reported in its summary for a human to move.
4. **Checks**: validate on every write, then typecheck, lint and verify on
   the route. Sessions run one after another.

After this step the generated app works end to end on the mock API.

## Implementation details

### `src/stages/frontend/pages.ts`

```ts
export async function buildPages(ctx: StageContext, inv: Inventory, screens: Screens, flows: Flows, contract: Contract): Promise<SessionResult[]>;
export function pageTask(input: { screen: Screen; dialogs: Screen[]; sections: Section[]; nodes: Node[]; steps: Step[]; alternatives: Alternative[]; entityFiles: Record<string, string>; recipes: Record<string, string>; newComponents: string[] }): string;
```

One session per page screen, its dialogs and drawers included (same route
folder):

- `id: 'page:S02'`, `allowWrite: ['<routeFolder>/**']`, origin `model`,
  `maxTurns: 14`.
- Task text, in this order:
  1. The shell as it stands (the model reads it; say it must keep the
     `data-screen`, `data-section` and `data-testid` attributes and the H1).
  2. The screen's sections and nodes as JSON, and the dialogs' too.
  3. The flow steps and alternatives this screen serves, verbatim (fields
     with labels, limits, examples; what the website shows on invalid,
     failure, empty, confirm, denied, not found).
  4. The entity files the screen's `data` refers to: `schema.ts`, `hooks.ts`
     and `index.ts` contents (so hook names and types are exact), plus
     `entities/auth/index.ts`.
  5. The recipe text of every DS component the nodes reference (deduped),
     and of the new components used (their `.recipe.tsx`).
  6. Rules: every node's root element gets `data-testid={node.id}`; forms
     through the `Form` recipe (`Controller`, rules with messages, `noValidate`,
     `setError` from `APIError.fields` on 400, a `root` error on other
     failures with a retry); mutations show `loadingWithReason`; lists show
     loading, empty and error states from the hook; navigation with
     `NextLink` or `useRouter`; destructive actions confirm in a `Dialog`;
     no data access outside the entity hooks (no `Server` import); no new
     files outside this folder except what the shell already names; text
     in the design's voice; density `<brief.density>`.
- `checksAtEnd`: `validate` (folder), `typecheck`, `lint` (folder),
  `verify <route>`.
- Sessions run one at a time (typecheck is app-wide; a half-written page
  elsewhere would fail it). Record per session: turns, writes, usage, cost.

The `frontend` stage runs `buildPages` after `buildNewComponents`; a
session ending other than `done` is recorded and the stage continues, then
fails at the end listing the screens that didn't finish (the user decides:
rerun that screen with `--from frontend --screen S04`, a flag to add).

### Tests

`pageTask` on the golden freelancer workspace's S02: contains the hooks file
text, the `Table` recipe, the steps' field labels, and the rule lines.

## Done when

```sh
pnpm weave run fixtures/ideas/freelancer-workspace.md --run <id> --to frontend
cd runs/<id>/app && pnpm typecheck && pnpm nx lint web && pnpm verify / /projects /projects/<id> …
```

and the core loop works by hand: sign in as demo, create a project, add a
task, filter, mark done, delete, sign out.

## Watch out

- The results message grows with every read; the system prompt tells the
  model to read a file once and write complete files.
- If a page needs a piece a second page also needs, the model must say so
  in `done`'s summary; moving it to `blocks` is a human decision this week.
