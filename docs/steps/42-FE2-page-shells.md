# 42 · FE2 Routes, navigation and page shells from screens

Phase 7 · 90 min · Depends: S2 · Decisions: D3.6 C, D7.1 A, D7.3 C · Spec:
specs/design.md "Screens"; ARCHITECTURE.md "Generated app"

## Goal

Everything deterministic about the frontend written by code: one route
folder per page screen with a shell that already has the H1, the sections
and a manifest of the nodes to build; dialog and drawer files beside their
page; the navigation; the sign-in guard. The model (step 44) only fills
sections.

## What this step does

1. **Everything deterministic about the frontend is written by code**: for
   each page screen a route folder with a page shell that already has the
   H1, one wrapper per section with the right layout classes, and a comment
   manifest listing every node to build with its component, text, role,
   data, flow steps and states. Every node will carry `data-testid` with its
   id, so tests and checks can find it.
2. **Dialogs and drawers** become files beside their page, from the Dialog
   recipe's skeleton.
3. **Navigation** is generated into the header from the design's navigation
   items, with sign-in and sign-out, and a guard sends signed-out visitors of
   protected pages to the sign-in page.
4. **Checks**: validate, typecheck, build, and verify on every route.
5. **Tests** snapshot the generated shells from the golden design.

After this step the model's job is reduced to filling sections, and the
app already builds and navigates.

## Before you start

- Template routes: `web/app/(routes)/page.tsx` (starter home, to be
  replaced), `layout.tsx` mounting `UIRoot`, `Providers`, `PageLayout`;
  `PageHeader.tsx` with a brand link and the theme toggle.
- `Section` from `@packages/ui/Section`: `title`, `description`,
  `headerAction`, `headingAs="h1"` for the page title.
- Nodes carry `id` like `S02.n07`; tests and checks locate them by
  `data-testid={node.id}`.

## Implementation details

### `src/codegen/pages.ts`

```ts
export function generatePages(run: Run, screens: Screens, scope: Scope, contract: Contract): string[];
export function routeFolder(route: string): string;      // '/projects/[projectId]' → 'web/app/(routes)/projects/[projectId]'; '/' → 'web/app/(routes)'
export function nodeManifest(screen: Screen, sections: Section[], nodes: Node[]): string;   // the comment block
```

**Page shell** (`<routeFolder>/page.tsx`), for each `type: 'page'` screen:

```tsx
'use client';

import { Section } from '@packages/ui/Section';
import { useRequireUser } from '@app/entities/auth';   // only for access: signedIn

/*
 * Screen S02 "Projects" · template list · serves F02.S01, F02.A01, F03.S01
 * States: loading, empty, error
 * Sections and nodes to build (02-screens.json). Keep data-testid on every node's root element.
 * S02.sec1 page-header (row, gap 4) · serves F02.S01
 *   S02.n01 [h1] "Projects" (role heading, states default)
 *   S02.n02 [ds Button variant=primary] "Create project" → S03 (role primary-action, flowSteps F03.S01)
 * S02.sec2 list (column, gap 3) · serves F02.S01, F02.A01
 *   S02.n03 [ds Table] data Project.name, Project.openTaskCount (role display, states default)
 *   S02.n04 [ds Section] "No projects yet" (states empty) …
 */
export default function ProjectsPage() {
  const { user, loading } = useRequireUser({ signInPath: '/sign-in' });
  if (loading || !user) return null;
  return (
    <Section title="Projects" headingAs="h1" data-screen="S02" data-testid="S02.n01">
      <div data-section="S02.sec1" className="flex-row-gap-4 items-center">{/* FE4 */}</div>
      <div data-section="S02.sec2" className="flex-col-gap-3">{/* FE4 */}</div>
    </Section>
  );
}
```

The H1 text is the level-1 heading node's text (DESIGN-015 guarantees one);
its `data-testid` is that node's id. Section wrappers get Tailwind layout
classes from the section's `layout` (row/column/grid with `gap-<key>`,
`grid-cols-<n>`), within the 50-character rule. Public screens skip the
guard. Dynamic segments: the shell reads `useParams()` and passes ids to
hooks later (leave a comment naming the param).

**Dialogs and drawers**: `<parent routeFolder>/<PascalName>Dialog.tsx`
exporting `{ open, onOpenChange }` props, built from the `Dialog` recipe's
skeleton (title from the screen name, body placeholder, the same manifest
comment). The parent page's manifest notes which node opens it.

**Navigation**: regenerate `web/app/components/PageHeader.tsx`: brand =
`scope.app.name` linking to the entry page; items from `ia.navigation.items`
as `NextLink`s (`signedIn` items only when `useMe()` has a user); sign-in
link or a sign-out `Button` (`useSignOut`); the theme toggle stays. Every
navigation model renders as a top bar this week; `data-nav-model` records
the IA's choice (a simplification to note in the README).

**Root layout**: keep `layout.tsx`; add `metadata.title = scope.app.name`
in a server `layout.tsx` (it already is one).

**Home**: if no screen has route `/`, the shell for `/` redirects to the
first entry page (`redirect()` from `next/navigation` in a server page).

All files through `writeGenerated` (origin `codegen`, step `FE2`); prettier.
Validate each page with the app's `tools/validate-files.mjs`; `pnpm
typecheck`; `pnpm verify <route>` for every page route (dialogs are not
routes).

### Tests

`pages.test.ts` on the golden screens: file list snapshot; each file
transpiles; a `signedIn` page contains `useRequireUser`; a dialog file
exists beside its parent; `PageHeader.tsx` lists every navigation item.

## Done when

```sh
pnpm test -- src/codegen/pages.test.ts
cd runs/<id>/app && pnpm typecheck && pnpm build && pnpm verify / /projects   # every route renders its H1
```

## Watch out

- Shells are later overwritten by the model; the ledger flips their origin
  to `model` on that write, which the LOC-by-origin metric relies on.
- Route folders never import each other (ESLint enforces it); shared
  pieces belong in `web/app/blocks` or `components`.
