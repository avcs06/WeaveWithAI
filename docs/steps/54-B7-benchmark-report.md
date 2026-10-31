# 54 · B7 Benchmark table and CLI

Phase 8 · 60 min · Depends: B2 to B6 · Decisions: D13.3 A, D13.4 A

## Goal

One table with every number, a verdict per threshold, deltas against the
previous benchmark of the run, and the stage and command that produce it.

## What this step does

1. **Every number becomes a metric** with a label, a scope (app or route), a
   unit, a threshold and a verdict (pass, warn, fail, info). Thresholds are
   the D13.3 defaults.
2. **One markdown table** (`05-benchmark.md`): a verdict line, a summary by
   category, a per-route table, a code table, the top duplicates, the screen
   reader summary, and a delta column against the previous benchmark of the
   same run when there is one.
3. **An orchestrator** builds, serves, runs every tool in order with each in
   its own try/catch (a broken tool becomes an info row, never a crash),
   writes `benchmark.json` and keeps a history.
4. **A `bench` stage and a `weave bench` command**: the stage runs after
   the frontend and again after repairs.
5. **Tests** on fixture parts for verdicts, deltas and missing tools.

After this step the proof of the project exists: one table per generated
app, before and after repairs.

## Implementation details

### 1. `src/bench/report.ts`

```ts
export type Metric = { id: string; label: string; scope: 'app' | 'route'; route?: string; value: number | string | null; unit: string; threshold?: { op: '>=' | '<=' | '==' ; value: number; warnAt?: number }; verdict: 'pass' | 'warn' | 'fail' | 'info'; source: string };
export type Benchmark = { runId: string; stage: 'frontend' | 'repair' | 'manual'; createdAt: string; metrics: Metric[]; summary: { pass: number; warn: number; fail: number } };
export const THRESHOLDS = { lhPerfDesktop: 90, lhPerfMobile: 80, lhA11y: 100, lhBestPractices: 90, lhSeo: 90, axeSeriousCritical: 0, contrastFailures: 0, unnamedControls: 0, keyboardReachPct: 100, focusVisiblePct: 100, clonesPct: 3, cloneMaxLines: 30, dsDuplicates: 0, tscErrors: 0, validateErrors: 0, firstLoadKb: 250 } as const;
export function buildBenchmark(parts: { lighthouse?: LighthouseRow[]; accessibility?: AccessibilityRow[]; screenReader?: ScreenReaderRow[]; keyboard?: KeyboardRow[]; code?: CodeReport; server?: ServerInfo; rubric?: RubricReport }, meta: { runId: string; stage: Benchmark['stage'] }): Benchmark;
export function renderBenchmark(current: Benchmark, previous?: Benchmark): string;   // 05-benchmark.md
```

`renderBenchmark` sections:

1. **Verdict**: `N fail · M warn · K pass`, the stage, the date, and the
   server line (gzip, etag, immutable static).
2. **Summary**: category rows (Performance, Accessibility, Screen reader,
   Keyboard, Duplicates, Code quality, Bundle) with the worst route's
   value and the verdict.
3. **Per route**: one row per route; columns Perf D, Perf M, A11y, BP, SEO,
   LCP ms, CLS, TBT ms, axe S+C, contrast fails, unnamed, kbd reach %,
   focus vis %, trap, first-load KB. A failing cell is marked `!`.
4. **Code**: tsc errors, ESLint errors and warnings, validate errors by rule
   (top 5), clones % and count and max lines, DS duplicates by kind, unused
   files, exports, dependencies, lines by origin with percentages.
5. **Duplicates**: the top 5 clones with file pairs and line counts; the
   near-named components; native controls in components.
6. **Screen reader**: per route landmarks, headings outline summary,
   unnamed, log file link.
7. **Delta** (when `previous`): a column `Δ` on the per-route and code
   tables, computed from the previous `benchmark/history/*.json`.
8. **Visual rubric** (when `reports/rubric.json` exists, step 46).

### 2. `src/bench/index.ts` and the stage

```ts
export async function runBenchmark(ctx: StageContext, opts: { only?: string[]; skip?: string[]; stage: Benchmark['stage'] }): Promise<Benchmark>;
```

Order: build (48) → start server → `assertServing` → routes from the
screens and the seeded store → Lighthouse (49) → accessibility (50) →
screen reader (51) → keyboard (52) → stop server → code (53) → build and
render → write `benchmark.json`, copy to `benchmark/history/<iso>.json`,
write `05-benchmark.md`. Every tool in its own `try/catch`: a failure
becomes an `info` metric with the error and the run continues. Events
`bench:start`, `bench:tool` (name, ok, durationMs), `bench:end`.

Stage `bench` registered after `frontend`; `weave run` runs it when
`frontend` finishes, and again after `repair` (step 57). CLI:
`weave bench <runId> [--only lighthouse,keyboard] [--skip screenReader]`.

### 3. Tests

`report.test.ts`: `buildBenchmark` from small fixture parts gives the
expected verdicts (a 75 desktop performance score fails, an 85 mobile
passes); `renderBenchmark` with a previous benchmark shows a `Δ` column;
a missing part produces `info` metrics, not a throw.

## Done when

```sh
pnpm weave bench <runId>
cat runs/<id>/05-benchmark.md
```

Gate **G7** part one: the freelancer workspace's table exists with a verdict
on every threshold.

## Watch out

- The thresholds are reported, never used to loop a model; repairs come
  from the tests (Phase 9).
- Keep `benchmark.json` stable in shape: the dashboard (step 59) reads it.
