# 51 · B4 Screen reader

Phase 8 · 60 min · Depends: B1 · Decisions: D13.1 C

## Goal

What a screen reader user gets on every route: the accessibility tree
scored for the things that make or break non-visual use, and a virtual
screen reader's spoken log saved for reading.

## What this step does

1. **Read each route the way a screen reader does**: the accessibility tree
   is taken from the page and scored for what breaks non-visual use:
   controls without a name, missing or multiple landmarks, heading outline
   problems, images without alt, fields without labels, live regions,
   dialogs that aren't named or don't take focus.
2. **A virtual screen reader walks the page** and its spoken phrases are
   saved per route, so a reader can "hear" the page in a text file; counts of
   role-only and duplicate phrases become metrics, and heading navigation is
   tried.
3. **If the virtual reader can't run in this setup**, the tree metrics stand
   and the log is marked unavailable.

After this step the table says how the app sounds, not only how it looks.

## Before you start

- Playwright 1.56 has `locator.ariaSnapshot()`: the accessibility tree as
  YAML (`- heading "Projects" [level=1]`, `- button "Create project"`).
- `@guidepup/virtual-screen-reader@0.33.0` drives a virtual screen reader
  over any DOM and records `spokenPhraseLog()`. It needs DOM globals; run it
  in Node over a `jsdom` document built from the rendered page's HTML.

## Implementation details

```sh
pnpm add @guidepup/virtual-screen-reader@^0.33.0 jsdom
pnpm add -D @types/jsdom
```

### `src/bench/screenReader.ts`

```ts
export type ScreenReaderRow = { route: string; tree: { nodes: number; unnamedInteractive: number; landmarks: { main: number; navigation: number; banner: number; contentinfo: number }; headings: { h1: number; skippedLevels: number; outline: string[] }; imagesWithoutAlt: number; unlabelledFields: number; liveRegions: number; dialogs: { opened: number; named: number; focusInside: number } }; spoken: { phrases: number; roleOnly: number; duplicates: number; headingsNavigable: number; logFile: string } };
export async function runScreenReader(opts: { run: Run; baseUrl: string; routes: RouteSample[]; screens: Screens }): Promise<ScreenReaderRow[]>;
```

Tree metrics (per route, signed in as demo, width 1280):

- `const yaml = await page.locator('body').ariaSnapshot()`; parse lines
  into `{ role, name, level, depth }` (indentation = depth; the pattern
  `- <role> "<name>" [level=N]`, name optional).
- `unnamedInteractive`: roles button, link, textbox, combobox, checkbox,
  radio, switch, tab, menuitem, slider with an empty name.
- Landmarks by role count; `main` should be exactly 1.
- Headings: count of level 1; `skippedLevels` = transitions that jump by
  more than one; `outline` = the heading texts with levels.
- From the DOM: `img` without `alt`; `input, select, textarea` without
  `aria-label`, `aria-labelledby` or a `label[for]`; `[aria-live], [role=status], [role=alert]`.
- Dialogs: for each node whose `navigatesTo` is a dialog, click its
  `data-testid`; count `[role=dialog]` with a name (`aria-label` or
  `aria-labelledby`) and whether `document.activeElement` is inside; Escape.

Spoken log:

```ts
import { JSDOM } from 'jsdom';
import { virtual } from '@guidepup/virtual-screen-reader';
const html = await page.content();                        // after networkidle and the list rendered
const dom = new JSDOM(html, { url: baseUrl });
// expose dom.window globals (window, document, Node, HTMLElement, getComputedStyle) for the duration
await virtual.start({ container: dom.window.document.body });
let last = -1; while (virtual.spokenPhraseLog().length !== last && virtual.spokenPhraseLog().length < 1500) { last = virtual.spokenPhraseLog().length; await virtual.next(); }
const log = virtual.spokenPhraseLog();
// headings navigable: restart, then repeat virtual.perform(virtual.commands.moveToNextHeading) counting distinct phrases
await virtual.stop();
```

Metrics: `phrases`, `roleOnly` (phrases that are just a role word like
"button"), `duplicates` (consecutive identical phrases), `headingsNavigable`.
Log file: `benchmark/screen-reader/<slug>.txt`, one phrase per line.
Output: `benchmark/screen-reader.json`.

## Done when

```sh
tsx src/bench/screenReader.ts <runId>
head runs/<id>/benchmark/screen-reader/projects.txt      # reads like a page being announced
```

## Watch out

- If guidepup can't run over jsdom in this setup within an hour, keep the
  tree metrics (they carry the thresholds) and mark the spoken log as
  `unavailable` in the JSON; the cut list already allows it.
