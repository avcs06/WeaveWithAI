<!-- Guidelines of the frames folder (CD8), written to .weave/04-frames/guidelines.md. No placeholders. -->
# Frames

- Each shell in `shells/` is a layout,
  `web/app/(routes)/(<shell name>)/layout.tsx`, such as
  `web/app/(routes)/(app)/layout.tsx`. Its parts (header, sidebar,
  navigation, footer) go in `web/app/components/<Name>/`.
- `navigation.json` lists each item's label and screen. Open the screen's
  route from `.weave/01-scaffold/routes.json`. Show a signed-in item only to
  a signed-in user.
- `frame-changes.json` lists, per screen, the frame nodes it adds or
  removes. Build them as props of the frame's parts.
- A shell that frames signed-in screens sends a visitor to sign in: read
  `useCurrentUser()` from `@app/entities/auth`.
- A layout shows its frame, and `children` in its main region. No page
  content.
- Keep `web/app/(routes)/layout.tsx` and `web/app/(routes)/page.tsx` as they
  are.
- Write only the shells' `layout.tsx` files and in `web/app/components/`.
