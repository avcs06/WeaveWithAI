# 60 · P2 Two full runs, a Modal run, benchmarks

Phase 10 · 3 h · Depends: T4, F8, P1 · Decisions: D12.1, D12.2 · Gate G8

## Goal

The numbers the submission is built on: two ideas end to end without
manual edits, one of them on Muse Spark Open through Modal, both
benchmarked.

## What this step does

1. **Two fresh end-to-end runs**: the project tracker and the unseen client
   notes, with no manual edits (any that happen are logged and counted).
2. **One run on Muse Spark Open through Modal**, as far as time and credits
   allow, so the open-weights prize has a verifiable run.
3. **Both apps benchmarked**; dashboards rendered; every number into the
   golden README.

After this step gate G8 is met and the submission has its numbers.

## Implementation details

1. Fresh runs, no `--run` reuse:
   `pnpm weave run fixtures/ideas/project-tracker.md` and
   `pnpm weave run fixtures/ideas/client-notes.md` (the unseen idea, end to
   end). Default `--to` is `repair`, which ends with the second benchmark.
2. No manual edits to generated apps. If one is unavoidable, write it in
   `runs/<id>/MANUAL-EDITS.md` with the file, the change and why; it
   counts against D12.2 A.
3. Modal: `pnpm weave run fixtures/ideas/project-tracker.md --backend modal`
   as far as credits and time allow (at least through `freeze`; the whole
   run if it fits). Keep its run id: the submission names it.
4. `pnpm weave show <id> --html` for each; read the dashboards.
5. `fixtures/golden/README.md` gets a final table per run: stages, rounds,
   tokens, cost, wall time, e2e pass count, repairs, the benchmark summary
   line, backend and models. Keep the run folders; they are demo material.

## Done when

Gate **G8**: two ideas generated end to end without manual edits (or every
edit logged); both benchmarked; one run on Muse Spark Open through Modal
recorded; dashboards render.
