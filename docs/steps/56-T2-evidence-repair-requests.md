# 56 · T2 Run, evidence, repair requests

Phase 9 · 60 min · Depends: T1, FE7 · Decisions: D8.3 A

## Goal

The generated specs run against the generated app, every failure mapped
to its flow, step and screen with evidence, and typed repair requests a
model session can act on.

## What this step does

1. **Run the specs** against the generated app and parse Playwright's report.
2. **Map every failure to its flow, step and screen**, with the screenshot and
   trace attached, into an evidence table (`06-e2e.md`).
3. **Write typed repair requests**: expected (the assertion), actual (the
   error), evidence, the screen's nodes, the owner (frontend, or the
   generator itself when the mock API misbehaved, which stops the run for
   you), and exactly which paths a repair may touch.

After this step a failing test becomes a precise, bounded work order.

## Implementation details

### `src/stages/tests/run.ts`

```ts
export type E2eResult = { flow: string; step: string; title: string; status: 'passed' | 'failed' | 'skipped'; error?: string; screenshot?: string; trace?: string; durationMs: number };
export type RepairRequest = { id: string; flow: string; step: string; screen: string; route: string; nodes: string[]; rule: 'E2E-FAIL'; expected: string; actual: string; evidence: { screenshot?: string; trace?: string; log: string }; owner: 'frontend' | 'codegen'; allowWrite: string[] };
export async function runE2e(ctx: StageContext, opts?: { specs?: string[] }): Promise<E2eResult[]>;
export function toRepairRequests(results: E2eResult[], plan: Record<string, FlowPlan>): RepairRequest[];
export function renderEvidence(results: E2eResult[], requests: RepairRequest[]): string;   // 06-e2e.md
```

- `runE2e`: `pnpm exec playwright test --reporter=json <specs>` in the app
  with `MOCK_DB_PATH=web/mocks/e2e-db.json`; parse the JSON reporter
  (`suites[].specs[].tests[].results[]`): status, `error.message` (first
  line kept whole, stack dropped), attachments by name (`screenshot`,
  `trace`) copied to `benchmark/e2e/<spec>/`. Titles carry the ids
  (`F03.A01 …`), so `flow` and `step` come from the title.
- `toRepairRequests`: for each failed test, the step's serving screen and
  nodes from the plan; `expected` = the assertion or the step's
  `websiteResponse`; `actual` = the error line; `owner: 'codegen'` when the
  error shows a 5xx from the mock or a schema parse failure in a hook
  (those are generator bugs: the stage reports them and stops for the
  user); otherwise `frontend` with `allowWrite = [routeFolder/**, …new
  components the screen uses]`.
- Writes `reports/e2e.json`, `reports/repairs.json` and `06-e2e.md`: a
  table per flow (step, status, error, screenshot link) and the requests.

The `e2e` stage now runs generation then `runE2e`; a run with failures
ends `stage:done` with a count (repairs are step 57's job), not `StageFailed`.

### Tests

`run.test.ts` parses a saved Playwright JSON report fixture with one
failure into one request with the right screen and `allowWrite`;
`renderEvidence` snapshot.

## Done when

With a planted defect in the generated project tracker (remove the submit
button's `type="submit"` in a page): `pnpm weave run … --run <id> --to e2e`
produces `06-e2e.md` with the failing flow and a request naming the page
folder.
