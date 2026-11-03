<!-- CODE-006 (src/engine/conformance.ts) looks for each operation that loads a screen and its dialogs in the screen's route folder only, so a call made in a shared block fails it. -->

# Screens

- Each file here is one screen: its title, its purpose, its steps in
  reading order, its alternatives, the dialogs it opens, its route folder
  and the operations that load it.
- A screen goes in its route folder: `page.tsx` there, its styles in
  `page.css.ts` beside it, and its own parts and dialogs in `components/`
  beside it. A dialog or a part that two screens use is built once, in
  `web/app/blocks/` or `web/app/components/`.
- The template's starter page, `web/app/(routes)/(landing)/page.tsx` at
  `/`, is a placeholder. The screen at `/` writes over it when that screen
  is in the landing group; otherwise delete it.
- A screen fills its frame's main region: no header, navigation or footer
  of its own. Every screen but the landing page starts with a `PageHeader`
  from `@app/components/PageHeader`: its title is the page's only H1, with
  the description, the breadcrumb to the pages above, and the page's
  actions.
- The frame's container already sets the page padding, the width and the
  gap between sections. A page returns its sections, with no padding, max
  width or outer gap of its own.
- Build every step in the order its file gives them, and every
  alternative. A step that leads to a route opens it; a step that opens a
  dialog opens it.
- Load the records through the operations the screen's file names, its
  dialogs' included. Call each one inside the screen's route folder,
  where a check looks for it. A dialog or a part from `web/app/blocks/`
  or `web/app/components/` gets its records from the screen.
- For a component a step needs, ask the MCP: `search_components`, then
  `get_component` and `get_recipe`. When nothing fits, build it yourself in
  `components/` beside the page.

## The landing page

- Build the hero as the first section. Draw its background from the
  theme's brand colors through tokens, such
  as a gradient from `tokens.color.primary.bg` into
  `tokens.color.surface.pageBg`. Keep all text at 4.5:1 against every
  background color, in each supported mode.
- The headline is the page's only H1, in `tokens.fontFamily.display` at
  `tokens.fontSize.display`, `tokens.lineHeight.display` and
  `tokens.fontWeight.display`.
- Each action appears once in the view, the header included. When the
  design gives the hero signing up and the header only signing in, build
  it that way. The preview and the reasons repeat neither action.
- Build the preview from the app's own components and blocks, with records
  from the seed data. It is read-only: nothing in it saves. The app ships
  no images, so this preview is the landing page's picture.
- Put the three or four reasons in a grid. Give each an icon from
  `lucide-react` when the brief's `imagery` is `icons`.
- Make the brief's `signature` in `theme.json` visible on the landing page.
- All checks still hold: DESIGN-R-006 needs the H1 in the first view, and
  contrast and target sizes apply as everywhere else.
