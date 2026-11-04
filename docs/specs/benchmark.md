# Spec: benchmark

The benchmark stage measures the generated frontend once the last code stage
is done. It builds the app for production, serves it with Next's own server,
and runs Lighthouse, axe, a screen reader pass, a keyboard walk and the static
code checks. Every number lands in one table, `05-benchmark.md`, with a
verdict per threshold. Thresholds are reported, never sent back to a model,
and the stage makes no model calls. Its code goes in `src/bench/`, one file
per measurement.

## What it measures

| Area | Tool | Numbers |
| --- | --- | --- |
| Performance | Lighthouse 13 through its Node API on Playwright's Chromium, mobile and desktop presets | Scores (performance, accessibility, best practices, SEO); LCP, FCP, CLS, TBT, Speed Index, time to interactive; total bytes, unused JavaScript, DOM size |
| Accessibility | axe-core (`@axe-core/playwright`, WCAG 2.2 AA tags) and the rendered checks' contrast and target-size collectors | Violations by impact, with the rules hit; contrast failures and the worst ratio; targets under 24 and under 44 pixels |
| Screen reader | The accessibility tree (Playwright `ariaSnapshot`) and a virtual screen reader (`@guidepup/virtual-screen-reader`) | Unnamed controls, landmarks, heading outline, images without alt, unlabelled fields, live regions, dialog naming and focus; the spoken phrase log |
| Keyboard | A Playwright Tab walk | Reachable controls, visible focus, order against reading order, traps, Escape on dialogs, Enter and Space on buttons, skip link |
| Duplicates | jscpd over `web/app`, and five design-system checks | Clones and the duplicated percentage; hand-built elements the design system has, components named almost like a design-system one, native controls in new components, data access outside `entities`, one component name in two route folders |
| Code quality | tsc, ESLint, the MCP's validate, knip, the build manifests, the ledger | Type errors; ESLint and validate findings by rule; unused files, exports and dependencies; first-load JavaScript per route (gzip); lines of code by origin |

The browser tools run per route. The code checks cover the whole app, the
bundle per route. Shared types come from the code that has them: `Run`
(`src/core/run.ts`), `RouteSample` (`src/checks/index.ts`), `StageContext`
(`src/agents/stages.ts`).

## The production server

The app is measured as it would ship: `pnpm build` in the app
(`next build web --webpack`), served by `next start web --port <p>`. Next's
server gzips responses (`compress: true` is its default), sends ETags for
pages and serves `/_next/static/*` with
`Cache-Control: public, max-age=31536000, immutable`. It does not do Brotli,
so the numbers are with gzip, and the report's server line says so.

Template change, in `nextConfig` of `template/web/next.config.js`. There is no
Content-Security-Policy: it needs nonces that work with vanilla-extract and
Next, and Lighthouse's best-practices audit notes its absence.

```js
compress: true,
poweredByHeader: false,
async headers() {
  return [{ source: '/(.*)', headers: [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    { key: 'X-Frame-Options', value: 'DENY' },
  ] }];
},
```

`src/bench/server.ts`:

```ts
export async function buildApp(run: Run): Promise<{ durationMs: number; log: string }>;   // pnpm build in the app, log to benchmark/build.log
export async function startProdServer(run: Run, opts?: { port?: number }): Promise<{ baseUrl: string; port: number; stop: () => Promise<void> }>;
export async function assertServing(baseUrl: string): Promise<{ gzip: boolean; etag: boolean; immutableStatic: boolean; headers: Record<string, string> }>;
```

- `buildApp` sets `NEXT_PUBLIC_MOCK_LATENCY_MS=0`. The entity layer's mock
  delay (`web/app/entities/mock`) reads it, and Next inlines `NEXT_PUBLIC_`
  values at build time, so zero latency is a build setting.
- `startProdServer`: a free port from `net.createServer().listen(0)` unless
  `opts.port` is given;
  `execa('pnpm', ['exec', 'next', 'start', 'web', '--port', port], { cwd: appDir, env })`
  with `NODE_ENV=production`; poll `GET /` until 200, up to 60 s, which also
  warms Next's cache. `stop` kills the process group.
- `assertServing` runs before any measurement: fetch `/` with
  `Accept-Encoding: gzip` and read `content-encoding` and `etag`; parse one
  `/_next/static/` URL from the HTML and check that its `cache-control`
  contains `immutable`. The result goes to `benchmark/server.json`, and it is
  the report's `ServerInfo`.

The records live in the browser: each entity's store
(`createPersistentStore`, key `weave:<entity>`) starts from its seed rows when
the browser has none. Every page a Playwright tool opens gets a new browser
context, so it starts from the seed rows, and nothing one page changes
reaches the next.

`src/bench/server.test.ts` is skipped unless `WEAVE_BENCH_APP=<appDir>` is
set, since it is slow: build, start, `assertServing` all true, stop. Done when
`WEAVE_BENCH_APP=runs/<id>/app pnpm test -- src/bench/server.test.ts` prints
`gzip: true, etag: true, immutableStatic: true`: the runner started and
stopped the server and saw `content-encoding: gzip` on a page.

## Routes and states

Every screen of type `page` in `02-design/08-assemble.json` is measured, at its
route with each `[xId]` filled with the first seed row of entity X
(`concreteRoute`, `src/agents/04code/05pages/stage.ts`). Each route is a
`RouteSample` built the way that stage's `pageSample` builds it: the page's
primary actions, its dialog triggers (the `data-testid`s of the nodes whose
`navigatesTo` is a dialog), and `SIGNED_IN`
(`src/agents/04code/02contract/codegen.ts`) as its storage when the screen's
`access` is `signedIn`. Export `pageSample`, and let it and `routeSample`
(`src/agents/04code/rendered.ts`) take the base URL: `routeSample` builds
every URL on `APP_URL`, the dev server.

- **default**: signed in with `SIGNED_IN`, the member session the code stages
  check with, over the seed rows. A public route runs once, signed out.
- **empty**: the same session, with every contract entity's store written
  empty before the page loads: the key `weave:` plus the entity name with a
  lowercase first letter, set to `{"state":{"records":[]},"version":0}`.
  Records are not per user, so a second user would see the same rows.

| Tool | Widths | States |
| --- | --- | --- |
| Lighthouse | its mobile and desktop presets | default |
| Accessibility | 375 and 1280 | default and empty |
| Screen reader | 1280 | default |
| Keyboard | 375 and 1280 | default |

`openRoute` (`src/checks/browser.ts`) opens every page at 1280 by 900: give it
the width for the 375 runs. A route's slug, in file names, is the route with
`/` and `[]` replaced (`/projects` is `projects`).

## Thresholds

A metric with a threshold gets pass, warn or fail; one without gets `info`.
Lighthouse performance 90 on desktop and 80 on mobile, accessibility 100,
best practices and SEO 90; axe serious and critical violations 0; contrast
failures 0; unnamed controls 0; keyboard reachability and visible focus 100%,
no trap, and every opened dialog closed by Escape with focus given back; jscpd
duplication under 3% and no clone over 30 lines; design-system duplicates 0;
tsc errors and MCP validate errors 0; first-load JavaScript under 250 KB gzip
per route.

```ts
export const THRESHOLDS = { lhPerfDesktop: 90, lhPerfMobile: 80, lhA11y: 100, lhBestPractices: 90, lhSeo: 90, axeSeriousCritical: 0, contrastFailures: 0, unnamedControls: 0, keyboardReachPct: 100, focusVisiblePct: 100, clonesPct: 3, cloneMaxLines: 30, dsDuplicates: 0, tscErrors: 0, validateErrors: 0, firstLoadKb: 250 } as const;
```

The trap and the dialogs have no number there: a trap fails, and so does a
dialog that stays open on Escape or does not give focus back.

## When it runs

- **In `weave run`**: the stage `bench`, after `code-pages`, the last code
  stage. `PIPELINE` (`src/agents/stages.ts`) already lists `bench` there; its
  `StageDef` joins `stages` after `pagesStage`. `weave run` goes to the last
  registered stage by default, so a full run ends with the benchmark. Like the
  code stages, it writes no artifact (`produces: []`) and records its status
  with `updateStage`, so `weave show` lists it.
- **By hand**: `weave bench <runId>`, on any run with an app. A second
  benchmark of a run shows deltas against the one before.

`runBenchmark` (`src/bench/index.ts`) builds, starts the server and runs
`assertServing`; takes the routes from the screens and the seeded store; runs
Lighthouse, accessibility, screen reader and keyboard; stops the server; runs
the code checks; then builds and renders the benchmark: it writes
`benchmark.json`, copies it to `benchmark/history/<iso>.json` and writes
`05-benchmark.md`. Each tool runs in its own `try/catch`: a failure becomes an
`info` metric with the error, and the run goes on. Any tool can be left out
with `--only` or `--skip`. The events `bench:start`, `bench:tool` (name, ok,
durationMs) and `bench:end` go to `events.jsonl`.

```text
runs/<runId>/
  benchmark.json                      every metric of the latest benchmark
  05-benchmark.md                     the table
  benchmark/
    build.log  server.json            the build's output; the server's headers and checks
    lighthouse/<slug>-<preset>.json   Lighthouse's report, with the .html beside it
    accessibility.json                axe, contrast and targets per route, state and width
    screenshots/<slug>-<state>-<width>.png
    screen-reader.json                the tree and spoken-log metrics per route
    screen-reader/<slug>.txt          the spoken log, one phrase per line
    keyboard.json                     the walk per route and width
    jscpd/jscpd-report.json           jscpd's own report
    code.json                         every static number
    history/<iso>.json                each benchmark of the run, for the deltas
```

## Lighthouse

```sh
pnpm add lighthouse@^13.6.0 chrome-launcher@^1.2.2
```

`lighthouse@13.6.0` runs through its Node API against a Chrome with a remote
debugging port. `chrome-launcher@1.2.2` starts one from a binary, here
Playwright's Chromium: `chromium.executablePath()` from `playwright-core`.

```ts
export type LighthouseRow = { route: string; preset: 'mobile' | 'desktop'; scores: { performance: number; accessibility: number; bestPractices: number; seo: number }; lcpMs: number; fcpMs: number; cls: number; tbtMs: number; speedIndexMs: number; ttiMs: number; totalBytes: number; unusedJsBytes: number; domSize: number; reportJson: string; reportHtml: string };
export async function runLighthouse(opts: { run: Run; baseUrl: string; routes: RouteSample[]; presets?: ('mobile' | 'desktop')[]; runs?: number }): Promise<LighthouseRow[]>;   // src/bench/lighthouse.ts
```

- `const chrome = await launch({ chromePath: chromium.executablePath(), chromeFlags: ['--headless=new', '--disable-gpu'] })`,
  and `chrome.kill()` in a `finally`.
- Per route and preset:
  ```ts
  import lighthouse from 'lighthouse';
  import desktopConfig from 'lighthouse/core/config/desktop-config.js';
  const result = await lighthouse(url, { port: chrome.port, output: ['json', 'html'], logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'], disableStorageReset: true }, preset === 'desktop' ? desktopConfig : undefined);
  ```
- Signed in: the session is in localStorage, not a cookie, so no header can
  carry it. Lighthouse clears the origin's storage before each page unless
  `disableStorageReset` is set, which keeps Chrome's cache too. So before each
  run, connect Playwright to the same Chrome (`chromium.connectOverCDP` on
  `chrome.port`), replace the origin's localStorage with the route's
  `storage`, and clear the HTTP cache (`Network.clearBrowserCache` on a CDP
  session), so every run loads cold.
- Scores: `lhr.categories.<x>.score * 100`. The `numericValue` of
  `largest-contentful-paint`, `first-contentful-paint`,
  `cumulative-layout-shift`, `total-blocking-time`, `speed-index`,
  `interactive`, `total-byte-weight` and `dom-size`; the
  `details.overallSavingsBytes` of `unused-javascript`.
- With `runs` over 1, repeat and take the median of each number.
- Write `benchmark/lighthouse/<slug>-<preset>.json` and `.html`
  (`result.report[0]` and `[1]`).

`"bench:lh": "tsx src/bench/lighthouse.ts"` in the root `package.json` tries it
alone: a tiny CLI (`<runId> [--routes a,b]`) that starts the production server
and prints a table. There is no automated test beyond typecheck, since
Lighthouse needs the app. Done when `pnpm bench:lh <runId>` leaves a JSON and
an HTML report per route and preset in `benchmark/lighthouse/`, for every
route of a run of `fixtures/ideas/freelancer-workspace.md`.

## Accessibility

```ts
export type AccessibilityRow = { route: string; state: 'default' | 'empty'; width: number; axe: { critical: number; serious: number; moderate: number; minor: number; rules: { id: string; impact: string; nodes: number }[] }; contrast: { failures: number; worst: number | null }; targets: { small24: number; small44: number } };
export async function runAccessibility(opts: { run: Run; baseUrl: string; routes: RouteSample[] }): Promise<AccessibilityRow[]>;   // src/bench/accessibility.ts
```

- Per route, state and width, reuse the rendered checks' `axeCheck`,
  `contrastCheck` and `targetSizes` (`src/checks/collectors.ts`).
- `axe` counts the violations by impact and lists each rule hit with its node
  count. `contrast` counts the failures and keeps the lowest ratio, `null`
  when there is none. `targets` counts the controls under 24 and under 44
  pixels; `targetSizes` returns only `small24` today, so it gains `small44`.
- Write `benchmark/accessibility.json`, and a screenshot of each route, state
  and width to `benchmark/screenshots/<slug>-<state>-<width>.png`.

Done when `tsx src/bench/accessibility.ts <runId>`, a small CLI like
`bench:lh`'s, leaves counts per route and state in
`benchmark/accessibility.json`.

## Screen reader

```sh
pnpm add @guidepup/virtual-screen-reader@^0.33.0 jsdom
pnpm add -D @types/jsdom
```

Playwright 1.56 has `locator.ariaSnapshot()`: the accessibility tree as YAML
(`- heading "Projects" [level=1]`, `- button "Create project"`).
`@guidepup/virtual-screen-reader@0.33.0` drives a virtual screen reader over
any DOM and records `spokenPhraseLog()`. It needs DOM globals, so it runs in
Node over a `jsdom` document built from the rendered page's HTML.

```ts
export type ScreenReaderRow = { route: string; tree: { nodes: number; unnamedInteractive: number; landmarks: { main: number; navigation: number; banner: number; contentinfo: number }; headings: { h1: number; skippedLevels: number; outline: string[] }; imagesWithoutAlt: number; unlabelledFields: number; liveRegions: number; dialogs: { opened: number; named: number; focusInside: number } }; spoken: { phrases: number; roleOnly: number; duplicates: number; headingsNavigable: number; logFile: string } };
export async function runScreenReader(opts: { run: Run; baseUrl: string; routes: RouteSample[] }): Promise<ScreenReaderRow[]>;   // src/bench/screenReader.ts
```

Tree metrics, per route at 1280 in the default state:

- `const yaml = await page.locator('body').ariaSnapshot()`; parse the lines
  into `{ role, name, level, depth }`: indentation is depth, the pattern is
  `- <role> "<name>" [level=N]`, the name optional.
- `unnamedInteractive`: the roles button, link, textbox, combobox, checkbox,
  radio, switch, tab, menuitem and slider with an empty name.
- Landmarks by role count; `main` should be exactly 1. Headings: the count of
  level 1; `skippedLevels`, the transitions that jump by more than one level;
  `outline`, the heading texts with their levels.
- From the DOM: `img` without `alt`; `input, select, textarea` without
  `aria-label`, `aria-labelledby` or a `label[for]`;
  `[aria-live], [role=status], [role=alert]`.
- Dialogs: click each of the route's `dialogTriggers`; count the
  `[role=dialog]` with a name (`aria-label` or `aria-labelledby`) and whether
  `document.activeElement` is inside; press Escape.

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

Metrics: `phrases`; `roleOnly`, the phrases that are only a role word like
"button"; `duplicates`, consecutive identical phrases; `headingsNavigable`.
The log goes to `benchmark/screen-reader/<slug>.txt`, one phrase per line, and
the rows to `benchmark/screen-reader.json`. If guidepup cannot run over jsdom
here, the tree metrics stand, since they carry the thresholds, and the spoken
log is marked `unavailable` in the JSON.

Done when `tsx src/bench/screenReader.ts <runId>` leaves counts per route in
`benchmark/screen-reader.json`, and
`head runs/<id>/benchmark/screen-reader/projects.txt` reads like a page being
announced.

## Keyboard

```ts
export type KeyboardRow = { route: string; width: number; interactive: number; reachable: number; reachabilityPct: number; focusVisiblePct: number; inversions: number; trap: boolean; dialogs: { opened: number; escaped: number; focusReturned: number }; activation: { buttons: number; enterOk: number; spaceOk: number }; skipLink: boolean; unreachable: string[] };
export async function runKeyboard(opts: { run: Run; baseUrl: string; routes: RouteSample[] }): Promise<KeyboardRow[]>;   // src/bench/keyboard.ts
```

- Reuse `keyboardWalk` (`src/checks/keyboard.ts`) per route at 1280 and 375,
  in the default state, with `blockMutations: true` and the route's
  `dialogTriggers`. While it presses Enter and Space, the walk also swallows
  clicks, so no button changes data or leaves the route.
- `reachabilityPct` is `reachable` over `interactive`; `focusVisiblePct` is
  the walk's `focusVisible` over `reachable`.
- `unreachable` lists, by `data-testid` or CSS path, every interactive element
  Tab never reached: the walk's "not reachable with Tab" findings name them.
- Write `benchmark/keyboard.json`.

Done when `tsx src/bench/keyboard.ts <runId>` prints a table with percentages
per route and `benchmark/keyboard.json` exists.

## Code quality and duplicates

```sh
pnpm add jscpd@^5.4.2 knip@^6.43.0
```

`src/bench/code.ts`:

```ts
export type CodeReport = {
  tsc: { errors: number; lines: string[] };
  eslint: { errors: number; warnings: number; byRule: Record<string, number> };
  validate: { errors: number; warnings: number; byRule: Record<string, number> };
  clones: { percentage: number; count: number; maxLines: number; top: { lines: number; files: [string, string] }[] };
  dsDuplicates: { handBuiltElements: number; nearNamedComponents: { name: string; dsName: string }[]; nativeControlsInComponents: { file: string; tag: string }[]; dataAccessOutsideEntities: string[]; sameNameAcrossRoutes: string[] };
  unused: { files: number; exports: number; dependencies: number };
  bundle: { route: string; firstLoadKbGzip: number }[];
  linesByOrigin: Record<'template' | 'code' | 'model', number>;
};
export async function runCodeQuality(opts: { run: Run; inventory: Inventory; screens: Screens }): Promise<CodeReport>;
```

`Inventory` is from `src/ds/inventory.ts`; `Screens`, the data of
`02-design/08-assemble.json`, from `src/agents/02design/schema.ts`. Each
command runs in the app (`execa`, cwd the app folder) and covers every file
under `web/app`, not only one route's.

- tsc: `pnpm typecheck`; count the lines matching `error TS`.
- ESLint: the app's `eslint app --format json`, run in `web/` as
  `pnpm nx lint web` runs it; sum by `ruleId` and severity. ESLint 9 takes its
  config from the folder it runs in, and the app root's config turns on the
  three `tailwind-layout` rules that web's config turns off for app code.
- Validate: `node tools/validate-files.mjs --json <every .ts and .tsx under web/app except __tests__>`.
  Template change: `template/tools/validate-files.mjs` prints text and gains a
  `--json` flag that prints
  `[{ path, findings: [{ line, column, severity, rule, message, suggestion }] }]`.
- jscpd: the generator's own `jscpd` (root `node_modules`), with cwd in the
  app so the report's paths are app-relative:
  `jscpd web/app --min-tokens 50 --min-lines 5 --reporters json --output <run>/benchmark/jscpd --ignore "**/*.test.*,**/__tests__/**,**/node_modules/**,**/.next/**"`.
  From `jscpd-report.json`: `statistics.total.percentage`, and the top 5 of
  `duplicates[]` by lines (`lines`, `firstFile.name`, `secondFile.name`).
- Design-system duplicates, five ways:
  - `handBuiltElements`: validate findings with the rule `invalid-alternative`,
    the MCP's TSX rule for a hand-built element the design system has a
    component for, and the strongest duplicate signal there is.
  - `nearNamedComponents`: folder names under `web/app/components/` within
    Levenshtein distance 2 of an inventory component name, ignoring case, or
    equal to one.
  - `nativeControlsInComponents`: the JSX tags
    `button|input|select|textarea|table|a` (regex
    `<(button|input|select|textarea|table|a)[\s>/]`) in
    `web/app/components/**` and `web/app/(routes)/**`, excluding `NextLink`.
  - `dataAccessOutsideEntities`: files outside `web/app/entities` and
    `web/app/shared` that import `@app/shared/api`.
  - `sameNameAcrossRoutes`: component basenames present in two route folders.
- knip: write `knip.json` into the app
  (`{ "entry": ["web/app/**/page.tsx", "web/app/**/layout.tsx"], "project": ["web/app/**/*.{ts,tsx}"] }`),
  run the generator's own `knip --reporter json` in the app, and count
  `files`, `exports` and `dependencies`.
- Bundle, from the build: `web/.next/build-manifest.json` lists the shared
  `rootMainFiles`. Next 16.1 writes no `app-build-manifest.json`, so a route's
  own chunks come from
  `web/.next/server/app/<its folder under web/app>/page_client-reference-manifest.js`,
  with the folder `pageFolder` (`src/agents/04code/05pages/stage.ts`) gives:
  the `.js` files in the `chunks` of its `clientModules`, where chunk ids and
  URI-encoded file names alternate. Per route, sum
  `zlib.gzipSync(readFileSync('web/.next/' + chunk)).length` over the unique
  union of its chunks and `rootMainFiles`; KB with one decimal, under the same
  route as the other tables.
- Lines by origin: for every file in the app's ledger (`.weave/ledger.json`),
  count its lines under its `origin`, `code` or `model`. `template` is the
  lines of the `web/app/**` files not in the ledger.

Write `benchmark/code.json`. Test, `src/bench/code.test.ts`: in a temp folder,
two near-identical 40-line components make the jscpd wrapper report one clone;
`nearNamed('Buton', inventory)` finds `Button`; the native-control regex
matches `<button` but not `<Button`. Done when `tsx src/bench/code.ts <runId>`
on a freelancer workspace run, with a deliberately planted duplicate (a
route's component copied into another route), shows it in `code.json` under
`clones` and `sameNameAcrossRoutes`.

## Report and CLI

`src/bench/report.ts`:

```ts
export type Metric = { id: string; label: string; scope: 'app' | 'route'; route?: string; value: number | string | null; unit: string; threshold?: { op: '>=' | '<=' | '=='; value: number; warnAt?: number }; verdict: 'pass' | 'warn' | 'fail' | 'info'; source: string };
export type Benchmark = { runId: string; stage: 'code-pages' | 'manual'; createdAt: string; metrics: Metric[]; summary: { pass: number; warn: number; fail: number } };
export function buildBenchmark(parts: { lighthouse?: LighthouseRow[]; accessibility?: AccessibilityRow[]; screenReader?: ScreenReaderRow[]; keyboard?: KeyboardRow[]; code?: CodeReport; server?: ServerInfo }, meta: { runId: string; stage: Benchmark['stage'] }): Benchmark;
export function renderBenchmark(current: Benchmark, previous?: Benchmark): string;   // 05-benchmark.md
```

Every number becomes a metric with a label, a scope (app or route), a unit, a
threshold and a verdict. `stage` says what ran it: `code-pages` in
`weave run`, `manual` for `weave bench`. A missing part gives `info` metrics,
never a throw. `renderBenchmark` writes, in order:

1. **Verdict**: `N fail · M warn · K pass`, the stage, the date, and the
   server line (gzip, etag, immutable static).
2. **Summary**: a row per category (Performance, Accessibility, Screen reader,
   Keyboard, Duplicates, Code quality, Bundle) with the worst route's value
   and the verdict.
3. **Per route**: a row per route; columns Perf D, Perf M, A11y, BP, SEO,
   LCP ms, CLS, TBT ms, axe S+C, contrast fails, unnamed, kbd reach %,
   focus vis %, trap, first-load KB. A failing cell is marked `!`.
4. **Code**: tsc errors, ESLint errors and warnings, validate errors by rule
   (top 5), clones % with count and max lines, design-system duplicates by
   kind, unused files, exports and dependencies, lines by origin with
   percentages.
5. **Duplicates**: the top 5 clones with their file pairs and line counts; the
   near-named components; the native controls in components.
6. **Screen reader**: per route, the landmarks, the heading outline in short,
   the unnamed controls and a link to the log file.
7. **Delta**, when there is a previous benchmark: a `Δ` column on the
   per-route and code tables, from the latest earlier
   `benchmark/history/*.json`.

```ts
export async function runBenchmark(ctx: StageContext, opts: { only?: string[]; skip?: string[]; stage: Benchmark['stage'] }): Promise<Benchmark>;   // src/bench/index.ts
```

It runs the steps in "When it runs"; the stage calls it with
`stage: 'code-pages'`. CLI:
`weave bench <runId> [--only lighthouse,keyboard] [--skip screenReader]`, with
the tool names `lighthouse`, `accessibility`, `screenReader`, `keyboard` and
`code`. `src/cli.ts` already lists `weave bench <runId>` in its usage, and its
case in `main` prints a placeholder; `--only` and `--skip` join the
`parseArgs` options.

Test, `src/bench/report.test.ts`: `buildBenchmark` on small fixture parts
gives the expected verdicts (a 75 desktop performance score fails, an 85
mobile one passes); `renderBenchmark` with a previous benchmark shows a `Δ`
column; a missing part produces `info` metrics, not a throw. Done when
`pnpm weave bench <runId>` on a freelancer workspace run writes
`05-benchmark.md` with a verdict on every threshold.

## Watch out

- Stop the server in a `finally`: an orphaned `next start` holds its port.
- If Lighthouse or the browser will not start on WSL, use Playwright's
  Chromium with `--headless=new`. Any tool can be left out of a run.
- Mobile throttling makes Lighthouse slow: 20 to 30 s a run.
- Radix-based design-system components (menus, tabs) handle the arrow keys
  themselves; the walk presses only Tab, Enter, Space and Escape.
- The collectors judge only what the app made. Elements marked `data-ds` are
  the design system's: axe, the target sizes and the keyboard walk leave them
  out, and only contrast keeps them. The benchmark's counts inherit that;
  Lighthouse's accessibility score covers the whole page.
- Keep `benchmark.json` stable in shape: the deltas read earlier ones from
  `benchmark/history/`.
