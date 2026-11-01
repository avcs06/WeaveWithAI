<!-- Guidelines of the pages folder (CD9), written to .weave/05-pages/guidelines.md. No placeholders. -->
# Pages

- Your page goes in the route folder your task names: `page.tsx` there, and
  in `components/` beside it the page's own widgets, forms and dialogs.
- A placement marked `shared` uses its block from `web/app/blocks/`: pass it
  the words, the data and the `data-testid`s its nodes give on this page. A
  dialog in `sharedDialogs` comes from `web/app/blocks/` too.
- The page fills its frame's main region: no header, navigation or footer of
  its own.
- Build every step and alternative in `steps`, and every state the screens
  and nodes list.
- Write only inside your route folder.
