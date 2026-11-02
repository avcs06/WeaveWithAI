<!-- Guidelines of the frames folder, written to .weave/03-frames/guidelines.md. No placeholders. The pages session reads it too (its folders include 03-frames), so the paths bullet names the frames' paths, not the reader's. -->
# Frames

- `frames.md` lists each frame: what it shows around its screens, as steps
  in reading order, its alternatives (signed out), and its route
  group with the screens inside it.
- Each frame is a layout, `web/app/(routes)/(<route group>)/layout.tsx`,
  such as `web/app/(routes)/(app)/layout.tsx`. Its parts (header, sidebar,
  navigation, account menu, footer) go in `web/app/components/<Name>/`.
- A step that leads somewhere opens that route from
  `.weave/01-scaffold/routes.json` with `NextLink`, even when the screen is
  not built yet. The navigation marks the item of the screen the user is on.
- A frame around signed-in screens sends a visitor to sign in: read
  `useCurrentUser()` from `@app/entities/auth`, and redirect only when it is
  `null`. It is `undefined` until the saved session is read.
- The theme's `layouts` in `theme.json` give the app layout and the
  marketing layout. Build each frame on the one that fits its screens.
- A layout shows its frame, and `children` in its main region. No screen
  content.
- A frame has no H1, not even its logo: each screen's title is the page's
  only H1.
- Keep `web/app/(routes)/layout.tsx` as it is.
- The frames' paths are the files of each route group's folder, such as
  `layout.tsx` and its `layout.css.ts`, and `web/app/components/`. The route
  folders inside a route group belong to the screens.
