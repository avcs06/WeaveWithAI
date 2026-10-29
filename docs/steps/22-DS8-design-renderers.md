# 22 · DS8 Design renderers

Phase 3 · 45 min · Depends: DS7 · Decisions: D3.6 D (optional) · Spec:
specs/design.md "Rendering"

## Goal

`02-design.md` for review and the demo; optionally `02-wireframes.html`.

## What this step does

1. **Render the design to markdown**: theme swatches with contrast ratios,
   fonts, navigation, then every screen with its sections and nodes as an
   indented tree, then the new components with their reasons.
2. **Optional wireframes**: one HTML file drawing each screen as labelled
   boxes, for review and the demo.
3. **Snapshot tests.**

After this step any screen can be reviewed from the markdown alone.

## Implementation details

### `src/stages/design/render.ts`

```ts
export function renderDesign(brief: Brief, theme: Theme, screens: Screens, flows: Flows): string;
export function renderWireframes(screens: Screens): string;   // optional
```

`renderDesign`:

- `# <app>: design`, personality, voice, density, fonts, radius, focus ring.
- Theme swatches: a table per mode with role, hex, and the contrast ratios
  from `theme.contrast` for that role's pairs.
- Navigation model and items.
- Per screen, ordered pages first then dialogs: `## S02 Shelf` with route or
  "dialog of S02", template, access, roles, purpose, states; then each
  section `### S02.sec1 Toolbar (toolbar, row, gap 3)` and its nodes as an
  indented tree by `parent`:
  `[Button variant=primary] Add a book → S03 (F03.S01)` for DS refs,
  `[new BookCard]`, `[h1] Your shelf`, `[row gap 2]` for layouts; `data`,
  `field` and `states` appended in parentheses when present.
- New components with purpose, closest existing, why not, parts, keyboard,
  ARIA pattern, used on.
- Questions and impossible steps at the end.

`renderWireframes`: one self-contained HTML file, a `<section>` per screen
with a heading, each section a bordered box with its kind and title, each
node a labelled box (component name, text, role), nested by parent; a
`<style>` block with a few rules; no scripts, no external assets.

### Tests

Snapshot of `renderDesign` on the fixtures; `renderWireframes` output
contains one `<section id="S02">` per screen and no `<script`.

## Done when

```sh
pnpm test -- src/stages/design/render.test.ts
```

and you can review any screen of the freelancer workspace from `02-design.md`
alone.
