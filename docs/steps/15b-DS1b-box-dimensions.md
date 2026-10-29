# 15b · DS1b Fixed box dimensions

Phase 3 · 2 h · Depends: DS1 · Decisions: D3.1 B · Spec: ARCHITECTURE.md
"Design-system inventory"; specs/design.md "Inputs"

## Goal

The design stage lays pages out with real numbers: a Button is 32px or 40px
tall and as wide as its label, an Accordion header is one row, a Dialog is
520px wide. The inventory records every dimension that stays fixed, per
component, size and part, measured in a browser from a Storybook story.
Dynamic dimensions are not recorded: the agent handles those with wrap and
scroll.

## What this step does

1. **A measurement story** in the ui package renders every case twice, once
   with short and once with long content, each inside a marked wrapper. A case
   is a component at a size (`Button/sm`) or a component whose parts matter
   (`Accordion`, `Dialog/md`, `Table`).
2. **A tool in the template** opens that story on the running Storybook,
   reads the box of each case's root and of its named parts in both
   renderings, and prints the dimensions that stayed equal: those are fixed.
   Anything that moved with the content is dynamic and left out.
3. **The inventory runs the tool** on a cache miss, next to the exporter, and
   stores the result as `box` per component: `{ sm: { height: 32 },
   md: { height: 40 } }`, a part under its slot name (`trigger`, `md/header`).
4. **A real measurement is a fixture**, so tests and later stages read `box`
   without Storybook.

After this step the design stage knows each component's fixed heights and
widths.

## Before you start

- `template/tools/verify.mjs --recipes` already drives the user's Storybook on
  `localhost:6006` with `playwright-core` (Chromium is installed). Follow its
  `isUp` check and its error when Storybook is down. **Never start a second
  Storybook**: it rewrites the shared Vite cache and breaks the running one.
- Stories live under `packages/ui/src/**/*.stories.tsx`; `Recipes.stories.tsx`
  and `Showcase.stories.tsx` sit at the top level, so a top-level
  `Measure.stories.tsx` fits. The story id becomes `measure--all`.
- Components mark their parts with `data-slot`: Accordion `trigger`, `panel`;
  Dialog `header`, `body`, `footer`; FormControl `label-row`, `box`,
  `message`; Menu `item`; Table `header`, `row`, `pagination`; Tabs `list`,
  `trigger`; Section `header`; Checkbox and Radio `box`; Switch `track`.
- Dialog renders through a portal, so its surface is not inside the wrapper:
  find it by role and accessible name.
- Control borders are box-shadows and never change an element's size.

## Implementation details

### 1. `template/packages/ui/src/Measure.stories.tsx`

Title `Measure`, one story `All`, `layout: 'fullscreen'`, controls disabled.
Two columns: a 480px one with the short content and a 720px one with the long
content, so an element that fills its container reads as dynamic.

```tsx
type Case = {
  name: string;                           // 'Button/sm', 'Dialog/md', 'Table'
  parts?: string[];                       // data-slot names to measure
  render: (long: boolean) => ReactNode;
};
```

Each case renders as
`<div data-measure={name} data-content={long ? 'long' : 'short'} data-parts={parts?.join(' ')} className="inline-grid justify-items-start">`
with the component as the only child, so the wrapper's first element child is
the root to measure. Long content is longer, never wrapping for a one-line
control (one word against five), and a paragraph for a container.

| Case                          | Root                         | Parts                      | Content                                   |
| ----------------------------- | ---------------------------- | -------------------------- | ----------------------------------------- |
| `Button/sm`, `Button/md`      | height                       |                            | label                                     |
| `IconButton/xs`, `sm`, `md`   | height, width                |                            | tooltip only                              |
| `PopoverButton/sm`, `md`      | height                       |                            | label                                     |
| `Avatar/sm`, `md`, `lg`       | height, width                |                            | initials                                  |
| `Tag/xs`, `Tag/sm`            | height                       |                            | label                                     |
| `Chip/sm`, `Chip/md`          | height                       |                            | label                                     |
| `Checkbox/sm`, `md`           | height                       | `box`                      | label                                     |
| `Radio/sm`, `md`              | height                       | `box`                      | label                                     |
| `Switch/sm`, `md`             | height, width                | `track`                    | label                                     |
| `FormControl/sm`, `md`        |                              | `label-row`, `box`, `message` | label, value, help text                |
| `Accordion`                   |                              | `trigger`                  | one section, title and a paragraph        |
| `Tabs`                        |                              | `list`, `trigger`          | three tabs                                |
| `Section`                     |                              | `header`                   | title and description                     |
| `Dialog/sm`, `md`, `lg`       | width (`[role="dialog"]`)    | `header`, `footer`         | title, a paragraph, two actions           |
| `Dropdown`                    |                              | `item`                     | an open menu of three items               |
| `Table`                       |                              | `header`, `row`, `pagination` | three columns, five rows, pagination   |
| `Pagination/full`, `minimal`  | height                       |                            | 95 items                                  |

Dialog cases render open, with `title={`${name} ${content}`}` so the tool can
find each surface by its accessible name; the short and long titles differ
only after the name.

### 2. `template/tools/measure-design-system.mjs`

`node tools/measure-design-system.mjs` prints JSON. Steps: `isUp(6006)` or
fail with verify's message; open
`http://localhost:6006/iframe.html?id=measure--all&viewMode=story` at
1280×900, `networkidle` plus 500 ms; in the page, for every `[data-measure]`
read `getBoundingClientRect()` of its first element child and of the first
`[data-slot="<part>"]` under it for each name in `data-parts`; for a case
named in `data-portal` (Dialog) read `[role="dialog"][aria-label^="<name>"]`
instead of the child. Pair short and long by name; a dimension is fixed when
the two round to the same integer. Print one entry per case and part that has
a fixed dimension:

```json
{ "Button/sm": { "height": 32 }, "Dialog/md": { "width": 520 },
  "Dialog/md/header": { "height": 60 }, "Accordion/trigger": { "height": 44 } }
```

### 3. `src/ds/inventory.ts`

Option `measurer?: { file: string; args: string[] }`, default
`node tools/measure-design-system.mjs`, run like the exporter on a cache miss.
Split each key at its first `/`: the component, then the case key. Add to
`InventoryComponent`:

```ts
/** Fixed dimensions in px, by size or part: `sm`, `trigger`, `md/header`. Dynamic ones are absent. */
box?: Record<string, { height?: number; width?: number }>;
```

A key whose component is not in the inventory fails the build with its name.
`pnpm weave ds` adds a line: `box: 17 components measured`.

### 4. Fixtures and tests

- `src/ds/__fixtures__/boxes.json`: one real tool output. Regenerate
  `inventory.json` through the cache as in DS1.
- `inventory.test.ts`: the fake measurer prints `boxes.json`; the built
  inventory equals the fixture; Button `sm` is `{ height: 32 }` with no width;
  Avatar `md` has both; Dialog `md` has `width: 520`; a key for an unknown
  component throws.
- A test of the tool's pairing logic (export it from the `.mjs` and test with
  `node --test` like `generate.test.mjs`): equal in both renderings is kept,
  unequal is dropped, portal and part keys are named as above.

## Done when

```sh
pnpm --dir template nx lint ui                       # the story
pnpm --dir template typecheck
pnpm weave ds                                        # with Storybook on 6006; rebuild the cache first
pnpm test
```

The rebuilt inventory lists Button sm 32 and md 40, FormControl `sm/box` 32
and `md/box` 40, Avatar 28, 36 and 56, Dialog widths 400, 520 and 720, and an
Accordion trigger height.

## Watch out

- Delete `.weave-cache/inventory-*.json` before measuring, or the cache hides
  the new field.
- `verify --recipes` lists only `recipes--*` stories; the measure story is not
  checked there, so run the story once in the browser and look at it.
- Heights come from line-height tokens in px, so fonts do not change them;
  widths of text do, which is why only fixed widths survive.
- Two open modal dialogs stack; the tool reads sizes only, so that is fine.
