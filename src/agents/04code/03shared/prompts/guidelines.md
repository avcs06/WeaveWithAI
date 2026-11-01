<!-- Guidelines of the shared folder, written to .weave/03-shared/guidelines.md. No placeholders. -->
# Shared components, widgets, forms and dialogs

- Each new component in `components/` goes in `web/app/components/<Name>/`,
  one folder each.
- Each widget, form and dialog in `widgets/` and `dialogs/` is used on two or
  more screens. It goes in `web/app/blocks/<Name>/`, one folder each, named
  by what it is, never by its widget id.
- A block takes what differs per screen as props: its words, its data, the
  screen it opens, and the `data-testid` of each of its elements. Each
  placement in a widget's file shows the ids and words one screen gives it.
- Other code imports these and cannot change them, so build every state and
  variant the placements show.
- Your paths are `web/app/components/` and `web/app/blocks/`.
- These have no route yet: skip `pnpm verify`.
