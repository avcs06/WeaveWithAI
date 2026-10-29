# 59 · P1 Run dashboard

Phase 10 · 90 min · Depends: B7 · Decisions: D1.10 B

## Goal

One static HTML file per run that tells the story of the run for the
demo: timeline, issues per round, coverage matrix, benchmark before and
after, screenshots, e2e evidence.

## What this step does

1. **One static HTML file per run**, built from the run's own files: events,
   reports, the matrix, the benchmark and its history, screenshots, the
   e2e evidence, the ledger.
2. **Sections**: header with totals, a stage timeline with rounds and cost,
   issues per round, the coverage matrix, the benchmark tables with deltas, a
   screenshot gallery with each page's heading outline, the e2e table and
   repairs, lines by origin.
3. **`weave show <id> --html`** writes and opens it. No scripts, no
   external assets.

After this step a run can be shown in the demo as one page.

## Implementation details

### `src/dashboard/render.ts`

```ts
export function renderDashboard(run: Run): string;   // reads state.json, events.jsonl, reports/*, 04-matrix.json, benchmark.json and history, benchmark/screenshots, reports/e2e.json
```

Sections, each a plain HTML table or list with inline CSS (no scripts,
no external assets; relative `<img>` paths into `benchmark/screenshots`):

1. Header: idea name, run id, backend and models used, totals (calls,
   tokens, cost, wall time from first to last event).
2. Timeline: one row per stage with start, end, duration, rounds, tokens,
   cost; sub-rows for `nodes:S03`, `page:S02`, `repair:S04` sessions.
3. Issues per round: per stage a small table of rounds with mandatory and
   warning counts and the rule ids.
4. Coverage matrix: the `04-reconcile.md` table rendered as HTML (reuse
   `renderMatrix`'s data, not its markdown).
5. Benchmark: the current `05-benchmark.md` sections as HTML tables, with
   the delta column when a previous benchmark exists.
6. Screens: a gallery of `benchmark/screenshots/*` grouped by route, with
   the aria heading outline under each.
7. e2e: the evidence table and the repair requests with their outcome.
8. Ledger: lines by origin as a bar (percent widths) and the file counts.

`pnpm weave show <id> --html` writes `runs/<id>/dashboard.html` and prints
the path; `--open` tries `xdg-open`.

### Tests

`render.test.ts` on a fixture run folder (a few events, one report, a
small benchmark): the HTML contains each section's heading and no `<script`.

## Done when

```sh
pnpm weave show <id> --html --open
```

opens a page with every section filled for the freelancer workspace run.
