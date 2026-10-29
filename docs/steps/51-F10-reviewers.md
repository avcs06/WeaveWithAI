# 51 · F10 Reviewer agents in the stage runner

Phase 1 · 60 min · Depends: F6 · Decisions: D1.12 B, D1.5 A, D1.8 B ·
Spec: ARCHITECTURE.md "Stage runner"

## Goal

Every spec stage runs a fixed four-round schedule: generate, fix, fix, final
fix, with validation after each and the model reviewing its own output after
the second and third. Blockers the reviewers raise are fixed like validator
issues. The stage never fails on issues: what is left after the last round is
recorded as known, and the run continues.

## What this step does

1. **A fixed schedule replaces "repeat until clean".**

   | Round | Generator | Then | Reviewers |
   | --- | --- | --- | --- |
   | 1 | generate | validate | |
   | 2 | fix the mandatory issues | validate | 2 calls |
   | 3 | fix the mandatory issues and blockers | validate | 1 call |
   | 4 | final fix | validate | |

   A fix with nothing to fix is skipped, but the reviewer calls of that round
   still run on the output as it stands. The stage ends as soon as a review
   finds nothing on an output whose validation has no mandatory issue: a
   clean first draft costs one generation and two reviews. The strong model
   (D1.8) serves the generator from round 3; reviewers always use the
   default model.
2. **A reviewer call** takes the generator's full prompt (system and user
   messages), the JSON it produced, the validator warnings as already known,
   and the stage's review guide, and answers with major blockers through one
   shared review schema. Nothing else is in its context. Each blocker becomes
   a mandatory issue with rule `REVIEW`, so the report, the fix-up message
   and the round events carry it without new plumbing.
3. **Known issues instead of failure.** After round 4 (or an early end) the
   remaining mandatory issues and blockers are the stage's known issues: in
   the last report, in the `stage:done` event, in `state.json`, and in the
   stage result. The artifact is written and the next stage runs. Round 4's
   output is not re-reviewed, so blockers from round 3 are reported as
   "addressed in the final fix, not re-reviewed". `StageFailed` goes away;
   `weave run` exits 1 only for real errors (model, config, I/O).
4. **Reviewers ignore the small stuff.** The reviewer prompt says so in one
   place (minor, no-impact and low-impact problems, rare edge cases,
   non-ideal scenarios), and each stage's guide says which scenarios matter.
5. **A stage without a guide** follows the same schedule without the
   reviewer calls, so the runner's tests and the stub stage keep working.

After this step every spec stage is reviewed by the model, bounded by a
schedule everyone can read, and never blocks the pipeline.

## Before you start

- `runSpecStage` (step 06) owns the loop; `generateStructured` (step 03)
  owns every model call, including the replay cache and audit files. Both
  stay the only places that know about rounds and calls.
- Two identical reviewer requests would share one replay key and, at
  temperature 0.2, near-identical answers. The input message therefore
  names the sample (`Reviewer 1 of 2`), and reviewer calls pass
  `temperature: 0.7`; `GenerateInput` gets the optional `temperature` field
  step 03 reserved for this.

## Implementation details

### 1. `src/core/review.ts`

```ts
export const Blocker = z.object({
  at: z.string(),       // an ID ('F03.S02') or a JSON path, as Issue.at
  problem: z.string(),  // what is wrong, in one sentence
  fix: z.string(),      // what the corrected output must say instead
});
export const Review = z.object({ blockers: z.array(Blocker) });
export type Review = z.infer<typeof Review>;
export function toIssues(review: Review): Issue[];   // rule 'REVIEW', severity 'mandatory', message `${problem} Fix: ${fix}`
```

The schema is the same for every stage and every reviewer; only the guide
differs. Keep every field required (constrained decoding); an empty
`blockers` array is a clean review.

### 2. Prompts (`src/core/`)

- `prompt-review.md`, the reviewer's system prompt. Placeholder: `{{guide}}`.
  It says: you review the output of another model against its own
  instructions; report only major blockers, problems that would make the
  result wrong or unusable for its readers; ignore minor, no-impact and
  low-impact problems, rare edge cases, non-ideal scenarios, style and
  wording; the known issues listed in the input are already being handled,
  do not repeat them; when nothing major is wrong, return an empty list;
  every blocker names where it is, what is wrong and what the output must
  say instead. Then the stage guide under its own heading.
- `prompt-review-input.md`, the reviewer's user message. Placeholders:
  `{{sample}}` (`Reviewer 1 of 2`), `{{system}}`, `{{user}}`, `{{output}}`,
  `{{known}}` (the warnings as `- RULE at ID: message` lines, or `None.`),
  each under a heading, the prompt and output in fenced blocks.
- Each stage keeps its guide beside its prompt, `review-<stage>.md`: the
  scenarios to look for and the ones to ignore, in the stage's own words.
  Step 13 writes the first two.

### 3. `src/core/runSpecStage.ts`

```ts
export type SpecStageOptions<T> = {
  // ...as today, minus maxRounds
  /** The stage's review guide; when absent, no reviewer calls. */
  review?: string;
};
export type SpecStageResult<T> = { output: T; warnings: Issue[]; known: Issue[]; rounds: number };

const SCHEDULE = [
  { fix: false, reviewers: 0 },
  { fix: true, reviewers: 2 },
  { fix: true, reviewers: 1 },
  { fix: true, reviewers: 0 },
];
```

Per round `r` (1-based) with `pending` = the mandatory issues and blockers
carried from the previous round:

1. Generator: round 1 always generates. A later round generates only when
   `pending` is not empty, with the fix-up message listing `pending`
   (`formatForModel`) and the assistant's last JSON kept in the conversation
   (D1.5 A); otherwise the last output stands and the round logs
   `generated: false`.
2. `issues = validate(output)` (skipped when nothing was generated; the
   previous result stands); `writeReport` for the round.
3. Reviewers: `reviewers` calls from the schedule, only when `o.review` is
   given, in parallel (`Promise.all`), each
   `generateStructured({ stage: `${o.stage}-review${i}`, round: r, schema:
   Review, schemaName: 'Review', messages: [system, input], model:
   'default', temperature: 0.7, runDir })` with an `llm:call` event like the
   generator's. Audit files: `llm/<stage>-review<i>-r<r>.json`.
4. `pending = mandatory(issues) ++ blockers`; event `stage:round` with
   `generated`, `mandatory`, `warnings`, `blockers`.
5. End when the round had reviewer calls, `pending` is empty, and the
   validation had no mandatory issue. Otherwise continue; after round 4,
   `known = pending`.
6. On the end: event `stage:done` with `rounds` and `known: known.length`;
   `updateStage(run, stage, { status: 'done', rounds, known: known.length })`;
   return `{ output, warnings, known, rounds }`.

`StageState` gains `known?: number`; `weave show` prints it as a column and
`weave run` as `, N known issues` on the stage line. The CLI no longer
catches `StageFailed`; remove the class and its branch.

### 4. `src/core/llm.ts`

`GenerateInput` gets `temperature?: number` (default 0.2, as now); it goes
into the request and therefore into the replay key.

### 5. `src/core/runSpecStage.test.ts`

With the fake client, scripted per call in order:

1. Clean output, two empty reviews: round 1 generates, round 2 skips the fix
   and runs two reviewers, the stage ends after round 2 with 3 calls, no
   known issues, `rounds: 2`.
2. Round 1 has a mandatory issue; round 2 fixes it (the fix-up message
   lists it), validation is clean, reviewer 2 returns a blocker; round 3
   fixes (the fix-up message contains `REVIEW at <at>`), validation is clean,
   the one reviewer is clean: ends after round 3, 6 calls.
3. Blockers from every reviewer: round 4 runs the final fix, no reviewer,
   the result has `known` with the round-3 blockers and `state.json` has
   `known: n`; nothing is thrown.
4. No `review` option: the same schedule without reviewer calls; a
   mandatory issue that never clears gives 4 generator calls and `known` of
   length 1, with no error; a clean output ends after round 1's validation,
   since no later round has anything to do.
5. The two round-2 reviewer requests differ (the sample line) and their
   audit files have distinct names; the reviewer input lists the warnings.

### 6. Docs

ARCHITECTURE.md "Stage runner": the signature and the schedule table above,
the reviewer calls and the known issues. "Principles" item 5: bounded loops
by schedule; leftover issues are known issues, not a stopped run. The F7
exit codes: 1 is for errors only.

## Done when

```sh
pnpm test -- src/core/runSpecStage.test.ts
pnpm test
pnpm typecheck
```

## Watch out

- Keep prompt prose in the `.md` files; the code only fills placeholders.
- The reviewer sees the generator's system prompt, so a rule that is wrong
  in the prompt is wrong for both. Fix prompts, never the reviewer's verdict.
- Blockers are the model's opinion. If a reviewer keeps blocking something
  the validators allow and the user wants kept, the stage guide's ignore
  list is the place to say so; never special-case it in code.
- Known issues travel with the artifact into later stages. Downstream
  validators still apply; a known issue is a recorded gap, not a licence.
