<!-- Guidelines of the frames folder, written to .weave/04-frames/guidelines.md. No placeholders. -->
# Frames

- Each shell in `shells/` is a layout,
  `web/app/(routes)/(<shell name>)/layout.tsx`, such as
  `web/app/(routes)/(app)/layout.tsx`. Its parts (header, sidebar,
  navigation, footer) go in `web/app/components/<Name>/`.
- `navigation.json` lists each item's label and screen. Open the screen's
  route from `.weave/01-scaffold/routes.json`. Show a signed-in item only to
  a signed-in user.
- `frame-changes.json` lists, per screen, the frame nodes it adds or
  removes. The layout adds or removes them on that screen's route.
- A shell that frames signed-in screens sends a visitor to sign in: read
  `useCurrentUser()` from `@app/entities/auth`, and redirect only when it is
  `null`. It is `undefined` until the saved session is read.
- A layout shows its frame, and `children` in its main region. No page
  content.
- Keep `web/app/(routes)/layout.tsx` and `web/app/(routes)/page.tsx` as they
  are.
- Your paths are the files of each shell's folder, such as `layout.tsx` and
  its `layout.css.ts`, and `web/app/components/`. The route folders inside a
  shell's folder belong to the pages.
