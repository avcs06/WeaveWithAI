<!-- The pages session reads this guide too, so the bullet on where a frame lives names the frames' files, not the reader's. -->

# Frames

- `frames.md` lists each frame: what it shows around its screens, as steps
  in reading order, its alternatives (signed out), and its route
  group with the screens inside it.
- Code wrote each frame's layout, `web/app/(routes)/(<route group>)/layout.tsx`.
  It renders `PageLayout` from `@app/components/PageLayout` with the theme's
  app or marketing layout. `PageLayout` sets the header's height, the
  sidebar's width, what stays in view while the page scrolls, the
  separations and the page container. A frame around signed-in screens also
  sends a visitor to the landing page there. Never change the layout or
  `PageLayout`: a session that does fails.
- The layout imports one empty part for each bar its layout needs, such as
  `web/app/blocks/AppHeader/AppHeader.tsx` and
  `web/app/blocks/AppSidebar/AppSidebar.tsx`. Fill each one. Its comment says
  what the theme puts at its start, center and end, or its top and bottom.
- A part returns its items, not a bar: no `header`, `aside` or `footer`
  element of its own, and no height, padding, background or border around
  them. A header or footer lays its items in a row: push the end items over
  with `<div className="flex-1" />`. A sidebar lays them in a column.
- A piece a part uses, such as an account menu, goes in
  `web/app/components/<Name>/`, or in `web/app/blocks/<Name>/` when it loads
  or changes records.
- A step that leads somewhere opens that route from
  `.weave/01-scaffold/routes.json` with `NextLink`, even when the screen is
  not built yet. The navigation marks the item of the screen the user is on.
- A sidebar's navigation is a `SidebarMenu`: its `header` holds what sits
  above the list, such as the logo, a search or a Create button, its
  `footer` what sits below it, such as the account and sign out, and each
  destination is a `SidebarMenuItem` around a `NextLink`. `PageLayout`
  gives the sidebar the height under the header; the menu fills it and its
  list scrolls inside it.
- A part that shows the signed-in user reads `useCurrentUser()` from
  `@app/entities/auth`. It is `undefined` until the saved session is read.
- The design may have the header offer only signing in, because the
  landing page's hero offers signing up. Build it as the design says.
- A frame loads the records it shows through the operations `frames.md`
  names for it: call them in the part that shows them.
- A frame has no H1, not even its logo: each screen's title is the page's
  only H1.
- The wordmark is `Wordmark` from `@app/components/Wordmark`, with the app
  name as its children. Never style the app name by hand. When it leads
  home, wrap it in `NextLink` with `look="plain"`: its place already says
  it is a link, so it needs no dotted line. `Wordmark` is not itself a link.
- Keep `web/app/(routes)/layout.tsx` as it is.
- A frame is its layout, its parts in `web/app/blocks/` and the pieces they
  use. The route folders inside a route group are the screens'.
