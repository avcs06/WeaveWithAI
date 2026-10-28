# 57 · T3 Bounded repair

Phase 9 · 90 min · Depends: T2, FE1 · Decisions: D1.6 A (2 repair rounds),
D8.3 A

## Goal

Each repair request becomes a bounded model session that may touch only
the screen's own files, never the tests, verified by rerunning only the
failed specs, followed by a second benchmark.

## What this step does

1. **One model session per screen with open requests**, allowed to write only
   that screen's files; the failing spec is shown read-only and the loop
   refuses any attempt to edit it.
2. **The session must pass** validate, typecheck and the failed spec to
   count; two rounds at most; only failed specs are rerun.
3. **The benchmark runs again** after repairs so the table shows the deltas.
4. **Requests owned by the generator** are never sent to a model; they stop
   the run with the evidence.

After this step the generator can fix its own frontend within limits, and
you can see what each fix cost.

## Implementation details

### `src/stages/tests/repair.ts`

```ts
export async function runRepairs(ctx: StageContext, requests: RepairRequest[]): Promise<{ fixed: string[]; open: RepairRequest[] }>;
export function repairTask(request: RepairRequest, specText: string, screenNodes: Node[], pageText: string): string;   // pure
```

- Group requests by screen; one session per screen per round:
  `id: 'repair:S04:r1'`, `allowWrite` from the request, `denyWrite` adds
  `web/e2e/**` explicitly, origin `repair`, `maxTurns: 8`.
- Task: the requests (expected, actual, evidence log), the failing spec's
  text (read-only: say so), the page file(s) as they are, the screen's
  nodes, and the rule that the test is right unless it names a node that
  the design doesn't have (then say so in `done` and stop).
- `checksAtEnd`: `validate`, `typecheck`, `e2e` with the failed spec files
  (`runAppCheck('e2e', spec)` runs `playwright test <files>`).
- Round 2 for what still fails; after that, open requests are reported.
- Then `runBenchmark(ctx, { stage: 'repair' })` so `05-benchmark.md` shows
  the deltas.
- Events: `repair:start`, `session:*`, `repair:end` with fixed and open
  counts; refused writes (a model trying to edit a spec) are in
  `session:turn` events and summarized in `06-e2e.md`.

Stage `repair` registered after `e2e`; `weave run` default `--to` is now
`repair`.

### Tests

`repair.test.ts` with a fake model: a scripted write to
`web/e2e/F03-add-task.spec.ts` is refused and the session continues; a
scripted fix write inside the route folder followed by a passing fake
`e2e` check marks the request fixed.

## Done when

The planted defect from step 56 is repaired within 2 rounds:
`pnpm weave run … --run <id> --to repair` ends with `fixed: 1, open: 0`,
`06-e2e.md` shows the refused spec write if the model tried one, and
`05-benchmark.md` has a delta column.

## Watch out

- The model never sees the spec as editable; the task text says the test
  is the contract.
- A request with owner `codegen` is not sent to a model: it stops the run
  for the user with the evidence.
