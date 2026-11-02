<!-- The pages session reads this guide too, so the bullet on where a frame lives names the frames' files, not the reader's. -->

# Frames

- `frames.md` lists each frame: what it shows around its screens, as steps
  in reading order, its alternatives (signed out), and its route
  group with the screens inside it.
- Each frame is a layout, `web/app/(routes)/(<route group>)/layout.tsx`,
  such as `web/app/(routes)/(app)/layout.tsx`. Its parts (header, sidebar,
  navigation, account menu, footer) go in `web/app/components/<Name>/`, and
  a part that loads or changes records, such as the list of dashboards or a
  Create action, in `web/app/blocks/<Name>/`.
- A step that leads somewhere opens that route from
  `.weave/01-scaffold/routes.json` with `NextLink`, even when the screen is
  not built yet. The navigation marks the item of the screen the user is on.
- A sidebar's navigation is a `SidebarMenu`: its `header` holds what sits
  above the list, such as the logo, a search or a Create button, its
  `footer` what sits below it, such as the account and sign out, and each
  destination is a `SidebarMenuItem` around a `NextLink`. The sidebar fills
  the height under the header, and the list scrolls inside it.
- The header's height and the sidebar's top are one value: export it once
  from the layout's `layout.css.ts` and use it for both, so the sidebar
  touches the header.
- A frame around signed-in screens sends a visitor to the landing page: read
  `useCurrentUser()` from `@app/entities/auth`, and redirect only when it is
  `null`. It is `undefined` until the saved session is read.
- The theme's `layouts` in `theme.json` give the app layout and the
  marketing layout. Build each frame on the one that fits its screens.
- A layout shows its frame, and `children` in its main region. No screen
  content.
- On the landing page, the header offers only sign-in when the hero offers
  sign-up, or only sign-up when the hero offers sign-in. Follow the
  architect's choice and keep each action once across the entire view.
- A frame loads the records it shows through the operations `frames.md`
  names for it: call them in its layout and pass the records to its parts.
- A frame has no H1, not even its logo: each screen's title is the page's
  only H1.
- The wordmark is `Wordmark` from `@app/components/Wordmark`, with the app
  name as its children. Never style the app name by hand. Wrap it in
  `NextLink` when it leads home; `Wordmark` is not itself a link.
- Keep `web/app/(routes)/layout.tsx` as it is.
- A frame is the files of its route group's folder, such as `layout.tsx`
  and its `layout.css.ts`, with its parts in `web/app/components/` and
  `web/app/blocks/`. The route folders inside a route group are the
  screens'.
