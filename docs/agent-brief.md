# Building UI in this repository

## Workflow

1. For each component you use, call `get_recipe`, pick the case that fits
   (each says when to use it) and adapt it. Recipes are the supported usage;
   don't read the component's source.
2. For a whole page, put its data in `web/app/entities/<name>` and build the
   page in its route folder, `web/app/(routes)/<path>/`: `page.tsx` with its
   page-only components and controllers beside it. Move a piece to `blocks`
   or `components` only once a second route uses it.
3. Run `validate` on each file you write. At the end, run once:
   `pnpm typecheck`, `pnpm nx lint web` and `pnpm verify <route>`. All three
   passing means done.

## Already guaranteed

Every component server-renders and hydrates without a mismatch, works under
the React Compiler, and fits a 320px screen: `pnpm nx test ui` and
`pnpm verify --recipes` check each recipe for this. Don't re-check components;
`pnpm verify <route>` checks your page.

## Styling

- Layout styles use only Tailwind: `flex-row-gap-*` and `flex-col-gap-*`
  (never a bare `flex`), `items-*`, `justify-*`, `grid`, `gap-*`, padding,
  margin and sizes. In a `.css.ts`, display, flex and alignment properties
  are allowed only inside `@media`.
- No Tailwind variants (`sm:`, `hover:`), arbitrary values or negative classes.
- A class list has at most 50 characters, and an element at most two lists:
  `classNames('flex-row-gap-2 flex-wrap', 'items-center')`. Styles that don't
  fit go in a colocated `.css.ts` (vanilla-extract) using `tokens` from
  `@packages/styles/tokens.css`.
- Phones: `@media (max-width: 639px)`. Card grids:
  `repeat(auto-fill, minmax(min(100%, 280px), 1fr))`.

## App structure

- Folders in `web/app`: `shared` for app-wide plumbing with no UI;
  `entities` for domain data (types, seed data, store); `components` for
  reused basic components; `blocks` for reused complex components and
  controllers, which combine design-system components with entity data;
  `(routes)` for pages.
- Imports go one way: shared → entities → components → blocks → (routes).
  Reach a sibling folder through its `index.ts`; a package as
  `@packages/<package>/<Module>`.
- No backend yet: keep data in the entity, in a store made with `createStore`
  from `@packages/utils/state`.
