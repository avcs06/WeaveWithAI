# 06 · F6 Stage runner and prompt loader

Phase 1 · 30 min · Depends: F3, F5 · Decisions: D1.5 A, D1.6 A, D1.8 B ·
Spec: ARCHITECTURE.md "Stage runner"

## Goal

The loop every spec stage shares: generate, validate, send only mandatory
issues back, repeat within a bound, escalate to the strong model, fail with
a report. Plus the prompt loader that fills `{{placeholders}}`.

## What this step does

1. **The prompt loader** reads a prompt `.md`, strips the HTML comments we
   keep notes in, and fills `{{placeholders}}`; a missing or unused
   placeholder is an error, so a renamed placeholder can't slip by.
2. **The stage runner is the loop every spec stage shares**: call the model
   through step 03, run the stage's validator, and if mandatory issues remain,
   send only those back with "fix these and return the full JSON".
3. **The loop is bounded**: 3 rounds; the third round uses the strong model;
   if issues remain after the last round the stage fails with a report
   naming them. Warnings are reported and never looped on.
4. **Everything is logged**: a report per round, events per round and per
   call.
5. **Tests with a fake model** show a fix in round 2, a failure after round 3
   with the strong model used, and warnings ending a stage.

After this step a stage is just a schema, a prompt, a validator and a renderer.

## Implementation details

### 1. `src/core/prompt.ts`

```ts
export function loadPrompt(file: string): string;   // reads the .md, strips every <!-- ... --> block, trims
export function fillPrompt(template: string, values: Record<string, string>): string;
```

`fillPrompt` replaces every `{{name}}`; throws `Error('Prompt is missing
values for: a, b')` for leftovers and `Error('Prompt has no placeholder for:
x')` for unused keys, so a renamed placeholder can't go unnoticed. Comment
stripping uses `/<!--[\s\S]*?-->/g`. Idea files are loaded the same way.

### 2. `src/core/runSpecStage.ts`

```ts
export class StageFailed extends Error {
  constructor(public stage: string, public issues: Issue[], public rounds: number) {}
}

export type SpecStageOptions<T> = {
  run: Run;
  stage: string;                 // 'scope', 'flows', 'brief', 'ia', 'nodes:S03', 'contract', ...
  schema: z.ZodType<T>;
  schemaName: string;
  system: string;                // the filled prompt
  user: string;                  // inputs serialized (JSON blocks with headings)
  validate: (output: T) => Issue[];
  maxRounds?: number;            // default 3
  llm: ReturnType<typeof createLlm>;
};

export async function runSpecStage<T>(o: SpecStageOptions<T>): Promise<{ output: T; warnings: Issue[]; rounds: number }>;
```

Behaviour:

1. `appendEvent(stage:start)`. Round 1 messages: `[system, user]`.
2. After each response: `issues = validate(data)`; `writeReport(run, stage,
   round, issues)`; `appendEvent(llm:call …)` from the result;
   `appendEvent(stage:round, { round, mandatory, warnings })`.
3. Zero mandatory issues → `stage:done`, return `{ output, warnings, rounds }`.
4. Otherwise, if `round < maxRounds`, append to the messages the assistant's
   raw JSON and this user message, then loop:
   ```text
   Your JSON has problems that must be fixed. Fix only these and return the complete corrected JSON, keeping everything else exactly as it was:
   <formatForModel(mandatory)>
   ```
   Round 3 (a round after two failures) uses `model: 'strong'` (D1.8 B).
5. After the last round: `stage:failed`, throw `StageFailed` with the last
   mandatory issues.

### 3. Tests

`prompt.test.ts`: strips comments; fills; throws on missing and on unused.

`runSpecStage.test.ts` with a fake `llm` whose `generateStructured` returns
scripted outputs and records the inputs it got:

1. Round 1 output fails validation, round 2 passes: 2 calls; the second call's
   messages end with assistant JSON then the fix-up user message listing the
   mandatory issue; result `rounds === 2`.
2. Three failing rounds: throws `StageFailed` with `rounds === 3`; the third
   call used `model: 'strong'`.
3. Warnings alone end the stage in round 1 and come back in `warnings`.
4. `reports/<stage>.json` has one entry per round; `events.jsonl` has the
   start, three rounds and the failure.

## Done when

```sh
pnpm test -- src/core
pnpm typecheck
```

## Watch out

- The user message for a fix-up lists only mandatory issues; warnings never
  loop (principle 4).
- Keep the assistant's JSON verbatim (`result.raw`), not re-serialized.
