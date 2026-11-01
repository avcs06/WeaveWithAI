<!-- Guidelines of the pages folder (CD9), written to .weave/05-pages/guidelines.md. No placeholders. -->
# Pages

- Each page goes in the route folder your task names for it: `page.tsx`
  there, its styles in `page.css.ts` beside it, and in `components/` beside
  it the page's own widgets, forms and dialogs. A route folder inside it
  belongs to the page your task names for it, or to another task.
- A placement marked `shared` uses its block from `web/app/blocks/`: pass it
  the words, the data and the `data-testid`s its nodes give on this page. A
  dialog in `sharedDialogs` comes from `web/app/blocks/` too.
- The page fills its frame's main region: no header, navigation or footer of
  its own. The node with heading level 1 is the page's H1.
- Build every step and alternative in `steps`, and every state the screens
  and nodes list.
- Read only the files your page uses. Never read another route's files, or a
  block, component or widget your page does not use: no other page shapes
  yours.
- For a component the design asks for, ask the MCP: `search_components`,
  then `get_component` and `get_recipe`. Read only the blocks your
  `page.json` uses (placements marked `shared`, and `sharedDialogs`). When
  nothing fits, build it yourself in `components/` beside `page.tsx`; never
  search other folders for one.
- Your path is your route folder.
