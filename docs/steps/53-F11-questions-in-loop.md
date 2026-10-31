# 53 · F11 Questions inside the stage loop

Phase 1 · 30 min · Depends: F10 · Decisions: D1.7 C · Spec: ARCHITECTURE.md
"Stage runner"

## Goal

An interactive run answers the draft's questions while the stage runs, so the
same stage applies them, instead of asking after the stage and rerunning.

## What this step does

1. **The runner takes `ask?: (output) => Promise<Answers>`.** An interactive
   stage passes it; a non-interactive one does not, and the defaults stand.
2. **Asked after every round that produced new output**, with that output,
   so new questions a fix introduced get asked too. The stage's `ask` decides
   which questions to put to the user (blocking, not yet answered) and how
   (the terminal, step 13).
3. **Answers never force a generation.** Those given since the last
   generation ride along with the next fix in their own message
   (`prompt-answers.md`, after the issues). If no fix happens, they are
   carried forward unapplied.
4. **All answers come back** in the result's `answers`, applied or not, for
   the stage to save to `input/answers.json`, which the next stage's prompt
   and any rerun read as "Answers already given". A `stage:answers` event
   records each batch.

## Done when

```sh
pnpm test -- src/runner/runSpecStage.test.ts
pnpm typecheck
```

## Watch out

- The runner never asks the user itself; it only calls `ask`. Terminal I/O
  belongs to the stage.
- An answer applied in round 2 is also in the JSON the reviewers read, so a
  wrong answer surfaces as a blocker like anything else.
