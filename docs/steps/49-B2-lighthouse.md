# 49 · B2 Lighthouse

Phase 8 · 60 min · Depends: B1 · Decisions: D13.1 A, D13.3 A

## Goal

Lighthouse scores and lab metrics for every route, mobile and desktop,
signed in, from the production server, saved as JSON and HTML.

## What this step does

1. **Lighthouse runs for every route**, desktop and mobile, signed in through
   a cookie, on Playwright's Chromium.
2. **It collects** the four scores (performance, accessibility, best
   practices, SEO) and the lab metrics (LCP, FCP, CLS, TBT, Speed Index,
   time to interactive, bytes, unused JavaScript, DOM size), with medians when
   more than one run is requested.
3. **JSON and HTML reports** are saved per route and preset for the demo and
   for digging.

After this step the performance half of the benchmark table exists.

## Before you start

- `lighthouse@13.6.0` runs through its Node API against a Chrome with a
  remote debugging port; `chrome-launcher@1.2.2` starts one given a binary.
  Playwright's Chromium works: `chromium.executablePath()` from
  `playwright-core`.
- Lighthouse accepts `extraHeaders`, so the session cookie from
  `/api/auth/sign-in` makes signed-in routes measurable.

## Implementation details

```sh
pnpm add lighthouse@^13.6.0 chrome-launcher@^1.2.2
```

### `src/bench/lighthouse.ts`

```ts
export type LighthouseRow = { route: string; preset: 'mobile' | 'desktop'; scores: { performance: number; accessibility: number; bestPractices: number; seo: number }; lcpMs: number; fcpMs: number; cls: number; tbtMs: number; speedIndexMs: number; ttiMs: number; totalBytes: number; unusedJsBytes: number; domSize: number; reportJson: string; reportHtml: string };
export async function runLighthouse(opts: { run: Run; baseUrl: string; routes: RouteSample[]; cookie: string; presets?: ('mobile' | 'desktop')[]; runs?: number }): Promise<LighthouseRow[]>;
```

- `const chrome = await launch({ chromePath: chromium.executablePath(), chromeFlags: ['--headless=new', '--disable-gpu'] })`.
- Per route and preset:
  ```ts
  import lighthouse from 'lighthouse';
  import desktopConfig from 'lighthouse/core/config/desktop-config.js';
  const result = await lighthouse(url, { port: chrome.port, output: ['json', 'html'], logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'], extraHeaders: { Cookie: cookie } }, preset === 'desktop' ? desktopConfig : undefined);
  ```
  Scores: `lhr.categories.<x>.score * 100`. Audits: `largest-contentful-paint`,
  `first-contentful-paint`, `cumulative-layout-shift`, `total-blocking-time`,
  `speed-index`, `interactive` (`numericValue`), `total-byte-weight`,
  `unused-javascript` (`details.overallSavingsBytes`), `dom-size`.
- `runs > 1`: repeat and take the median of each number.
- Write `benchmark/lighthouse/<slug>-<preset>.json` and `.html`
  (`result.report[0]`, `[1]`). Slug = route with `/` and `[]` replaced.
- `chrome.kill()` in a `finally`.

Add a script entry for trying it alone: `"bench:lh": "tsx src/bench/lighthouse.ts"`
with a tiny CLI (`<runId> [--routes a,b]`) that starts the server (step 48)
and prints a table.

### Tests

None automated beyond typecheck (Lighthouse needs the app); the Done when
is the proof.

## Done when

```sh
pnpm bench:lh <runId>
ls runs/<id>/benchmark/lighthouse/        # json and html per route and preset
```

## Watch out

- The first run after a build warms Next's cache; run `GET /` once before
  measuring (`startProdServer` already does).
- Mobile throttling makes runs slow (20 to 30 s each); the cut list drops
  the mobile preset first.
