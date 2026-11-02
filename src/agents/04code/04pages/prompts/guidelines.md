<!-- Guidelines of the pages folder, written to .weave/04-pages/guidelines.md. No placeholders. CODE-006 (src/engine/conformance.ts) looks for each operation that loads a screen and its dialogs in the screen's route folder only, so a call made in a shared block fails it. -->
# Screens

- Each file here is one screen: its title, its purpose, its steps in
  reading order, its alternatives, the dialogs it opens, its route folder
  and the operations that load it.
- A screen goes in its route folder: `page.tsx` there, its styles in
  `page.css.ts` beside it, and its own parts and dialogs in `components/`
  beside it. A dialog or a part that two screens use is built once, in
  `web/app/blocks/` or `web/app/components/`.
- The screen at `/` replaces the template's starter page: delete
  `web/app/(routes)/page.tsx`.
- A screen fills its frame's main region: no header, navigation or footer
  of its own. Its title is the page's only H1.
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
