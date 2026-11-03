<!-- The pages session reads this guide too, so the bullet on where a frame lives names the frames' files, not the reader's. -->

# Frames

- `frames.md` lists each frame. It says what the frame shows around its
  screens, as steps in reading order. It gives the frame's alternatives
  (signed out), and its route group with the screens inside it.
- Code wrote each frame's layout,
  `web/app/(routes)/(<route group>)/layout.tsx`. It renders `PageLayout`
  from `@app/components/PageLayout` with the theme's app or marketing
  layout. `PageLayout` sets the header's height, the sidebar's width, what
  stays in view, the separations and the page container. In the app layout
  the frame stays in place, and only the main region scrolls. The sidebar
  is a `SidebarMenu` that `PageLayout` renders itself. The layout of a
  frame around signed-in screens also sends a visitor to the landing page.
  Never change the layout or `PageLayout`. A session that does fails.
- The layout imports one part for each area of the theme's layout, such as
  `web/app/components/AppHeaderRightSlot/AppHeaderRightSlot.tsx` and
  `web/app/components/AppSidebar/AppSidebar.tsx`. Fill each part. Its
  comment says what it holds, what it leaves out, and what the theme puts
  there.
- The header is three parts: `HeaderLeftSlot`, the header itself in the
  center, such as `AppHeader`, and `HeaderRightSlot`. `PageLayout` keeps
  each part in its place, with the center part in the middle of the bar.
  A part needs no spacer.
- Code already placed `PageLogo` and `UserMenu` where the theme put the logo
  and the account menu. Keep them where they are. Add the part's other
  items around them.
- A part returns its items, not a bar. It has no `header`, `aside`,
  `footer` or `SidebarMenu` of its own, and no height, padding, background
  or border around its items. A footer lays its items in a row. Push the
  end items over with `<div className="flex-1" />`.
- In the sidebar, `AppSidebar` returns the rows. Each destination is a
  `SidebarMenuItem` with `as={NextLink}` and its `href`. `AppSidebarHeader`
  holds what stays fixed above the rows, such as a Create button.
  `AppSidebarFooter` holds what stays fixed below them, such as the account
  menu. The menu's list scrolls between them.
- A piece a part uses goes in `web/app/components/<Name>/`, or in
  `web/app/blocks/<Name>/` when it loads or changes records.
- A step that leads somewhere opens its route with `NextLink`, even when
  the screen is not built yet. Take the route from
  `.weave/01-scaffold/routes.json`. The navigation marks the item of the
  screen the user is on.
- A part that shows the signed-in user reads `useCurrentUser()` from
  `@app/entities/auth`. It is `undefined` until the saved session is read.
- The design may have the header offer only signing in, because the
  landing page's hero offers signing up. Build it as the design says.
- A frame loads the records it shows through the operations `frames.md`
  names for it. Call each operation in the part that shows its records.
- A frame has no H1, not even its logo. Each screen's title is the page's
  only H1.
- The logo is `PageLogo`. It shows the app's name in the theme's logo style
  and leads home. Never write or style the app's name by hand. When the
  logo has an icon, pass it as `leftIcon` or `rightIcon`. The icon then
  joins the name in the link.
- Keep `web/app/(routes)/layout.tsx` as it is. Sign in and sign up have
  their own layout, `web/app/(routes)/(auth)/layout.tsx`, with no frame.
  Keep that layout and their pages as they are.
- A frame is its layout, its parts in `web/app/components/`, and the pieces
  they use. The route folders inside a route group belong to the screens.
