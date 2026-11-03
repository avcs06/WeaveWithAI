# Building UI in this repository

## Workflow

1. For each component you use, call `get_recipe`. Pick the case that fits
   and adapt it. Each case says when to use it. Call `get_component` for the
   component's props, their types and defaults. Recipes are the supported
   usage. Don't read the component's source.
2. Search or list to find what exists and the real token names. Each token
   comes with the class that applies it. Never invent a color, spacing value
   or component prop. Never read the token or Tailwind files. Never
   hand-build an element the system already has a component for.
3. Build a page in its route folder, `web/app/(routes)/<path>/`. The folder
   holds `page.tsx`, and the page's own components and controllers in
   `components/` beside it. A piece that a second route uses goes in
   `blocks` or `components`. Data comes from `web/app/entities/`.
4. Run `validate` on each file you write, and fix every finding. At the end,
   run `pnpm typecheck`, `pnpm nx lint web` and `pnpm verify <route>` once.
   You are done when all three pass.

## Already guaranteed

Every component server-renders and hydrates without a mismatch. It works
under the React Compiler and fits a 320px screen. `pnpm nx test ui` and
`pnpm verify --recipes` check each recipe for this. `pnpm verify <route>`
checks your page. Don't re-check components.

## Styling

- Put Tailwind variants and selectors, such as `hover:` and `sm:`, in a
  colocated `.css.ts` (vanilla-extract). Put arbitrary values, such as
  `w-[13px]`, and negative classes there too. The file uses `tokens` from
  `@packages/styles/tokens.css`.
- A class list has at most 50 characters. An element has at most two lists,
  such as `classNames('flex-row-gap-2 flex-wrap', 'items-center')`. Styles
  that don't fit go in the `.css.ts` too.
- Use a token for every color, spacing and size. A literal needs a comment
  on the property that says, in your own words, why the literal is right.
  "The design asks for it" is no reason, since the design may be wrong.
- Leave `variant`, `size` and `look` out to keep the defaults the theme set.
  Another value needs a comment on the prop with your own reason, the same way.
- For phones, use `@media (max-width: 639px)`. Records in a grid are a
  `CardList` with `layout="grid"`, which sets the columns.

## App structure

- `web/app` has these folders:
  - `shared` holds app-wide plumbing with no UI.
  - `entities` holds domain data: types, seed data and the store.
  - `components` holds reused basic components.
  - `blocks` holds reused complex components and controllers. They combine
    design-system components with entity data.
  - `(routes)` holds pages.
- A page starts with `PageHeader` from `@app/components/PageHeader`. The
  landing page, `web/app/(routes)/(marketing)/page.tsx` at `/`, starts with
  `Hero` from `@app/components/Hero` instead. A record that is gone shows
  `NotFound` from `@app/components/NotFound`.
- A list of records is a `CardList` or a `Table`.
- Imports go one way: shared → entities → components → blocks → (routes).
  Import a sibling folder through its `index.ts`. Import a package as
  `@packages/<package>/<Module>`.
- There is no backend yet. Each entity keeps its data in a store made with
  `createPersistentStore` from `@packages/utils/state`. The store sits behind
  the entity's hooks and functions.
