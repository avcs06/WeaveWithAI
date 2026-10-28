# 45 · FE5 Rendered checks

Phase 7 · 90 min · Depends: FE2 · Decisions: D3.7 B, D3.9 B · Spec:
specs/design.md "Rendered checks (Phase 7)"

## Goal

DESIGN-R-001 to 009 measured in a real browser on the generated app, as
reusable collectors: the `frontend` stage gates on the mandatory ones and
the benchmark (Phase 8) reports all of them.

## What this step does

1. **Nine rendered checks as reusable collectors**, each measuring a real
   page in a real browser: axe violations, text contrast from computed
   styles, a keyboard walk (every control reachable by Tab, visible focus,
   order, no trap, Escape closes dialogs, Enter and Space activate), target
   sizes, horizontal overflow, the H1 and primary action in the first
   viewport, body text size and line length, colors coming from the theme,
   spacing between groups larger than inside.
2. **The frontend stage ends with them** at three widths; a mandatory
   finding fails the stage with the rule and the element named.
3. **The benchmark reuses the same collectors** (Phase 8), so the gate and
   the report never disagree.
4. **Tests** on a fixture page with planted defects.

After this step "looks fine" is replaced by numbers per route.

## Before you start

- The template uses `playwright-core@1.56.1` and its installed Chromium.
  Add the same version at the root (`pnpm add playwright-core@1.56.1`) so
  `chromium.launch()` finds the same browser; run
  `pnpm exec playwright-core install chromium` once if it doesn't.
- `template/tools/verify.mjs` already measures overflow (`measureLayout`);
  copy that function rather than shelling out.
- Viewports: 320, 375, 1280 (D3.9 B), height 900.

## Implementation details

### `src/checks/`

```ts
// browser.ts
export async function withBrowser<T>(fn: (browser: Browser) => Promise<T>): Promise<T>;
export async function signedInContext(browser: Browser, baseUrl: string, email: string, password: string): Promise<BrowserContext>;  // POST /api/auth/sign-in, adds the cookie
export async function openRoute(context: BrowserContext, url: string, width: number): Promise<Page>;  // goto, networkidle, 300 ms settle

// collectors: each returns findings and metrics for one page
export type Finding = { rule: string; severity: 'mandatory' | 'warning'; message: string; element?: string };
export async function axeCheck(page: Page): Promise<{ findings: Finding[]; violations: AxeViolation[] }>;        // R-001: @axe-core/playwright, tags wcag2a wcag2aa wcag21aa wcag22aa; serious and critical mandatory
export async function contrastCheck(page: Page): Promise<{ findings: Finding[]; failures: ContrastFailure[] }>;  // R-002: in-page: each visible text element's color against its effective background (walk up for a non-transparent background); 4.5:1, 3:1 for ≥24px or ≥18.66px bold
export async function keyboardWalk(page: Page, opts: { blockMutations: true }): Promise<KeyboardReport>;      // R-003: see below
export async function targetSizes(page: Page, width: number): Promise<{ findings: Finding[]; small24: number; small44: number }>;  // R-004
export async function overflowCheck(page: Page): Promise<Finding[]>;                                                // R-005: measureLayout from verify.mjs
export async function firstViewport(page: Page, primaryTestIds: string[]): Promise<Finding[]>;                     // R-006: H1 and a primary action inside the first viewport, entry pages only
export async function typography(page: Page): Promise<Finding[]>;                                                   // R-007: font-size ≥ 14px on body text; paragraphs 45 to 90ch
export async function colorVariables(page: Page, themeHexes: Set<string>): Promise<Finding[]>;                     // R-008: computed colors ∈ theme vars; accent area ≤ 10% of first viewport
export async function proximity(page: Page): Promise<Finding[]>;                                                    // R-009: gap between [data-section] blocks > gaps inside
```

`keyboardWalk`: `page.route('**/*', …)` aborts non-GET requests while
walking (so Enter on a submit button can't mutate); collect focusable
elements in DOM order (`a[href], button, input, select, textarea,
[tabindex]:not([tabindex="-1"]), [contenteditable]`, visible, not
`aria-disabled` without a reason); press `Tab` up to `n + 5` times
recording `document.activeElement` (by `data-testid` or a CSS path); for
each focused element compare `outline-width`, `outline-style`, `box-shadow`
with its blurred state (focus visible); inversions between tab order and
DOM order; trap = never returning to the start within `2n` presses;
dialogs: for each trigger with `data-testid` of a node whose `navigatesTo`
is a dialog, click it, expect `[role=dialog]` with an accessible name
containing `document.activeElement`, press `Escape`, expect it closed and
focus back on the trigger; buttons: `Enter` and `Space` on each focused
button fire a click (an injected listener counts); skip link: a link to
`#main` first in tab order (warning). Report: `{ interactive, reachable,
focusVisible, inversions, trap, dialogs: { opened, escaped, focusReturned },
activation: { buttons, enterOk, spaceOk }, skipLink }` plus findings.

```ts
// index.ts
export async function runRenderedChecks(opts: { run: Run; baseUrl: string; routes: RouteSample[]; screens: Screens; theme: Theme }): Promise<{ issues: Issue[]; perRoute: RenderedReport[] }>;  // writes reports/rendered.json
```

`RouteSample = { route: string; url: string; screen: string; entry: boolean; primaryTestIds: string[] }`;
dynamic segments are filled from the seeded store (`resolveRouteSamples`
in `src/bench/routes.ts`, shared with Phase 8: `/projects/[projectId]` →
the first seeded project's id).

The `frontend` stage ends with `runRenderedChecks` against `pnpm dev`
(started like `verify.mjs` does) at the three widths; mandatory findings
throw `StageFailed('frontend', issues)`; warnings go to the report.

### Tests

`checks.test.ts`: a static fixture page served by `node:http` from
`src/checks/__fixtures__/` with planted defects (an icon button without a
name, grey-on-white text at 3:1, a 12px target, a `tabindex="-1"` link, an
`h1` below the fold, a `#333333` not in the theme) and a clean page; each
collector reports the planted defect and nothing on the clean page.

## Done when

```sh
pnpm test -- src/checks
pnpm weave run … --run <id> --to frontend     # rendered checks pass on every project-tracker route
```

## Watch out

- Headless Chromium on WSL needs `--no-sandbox` only when running as root;
  keep the default flags otherwise.
- Contrast on text over images or gradients is reported as `unknown`, not
  as a failure.
