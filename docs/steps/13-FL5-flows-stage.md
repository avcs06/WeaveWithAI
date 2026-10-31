# 13 · FL5 Wire the flows stage

Phase 2 · 30 min · Depends: FL2, FL3, FL4, F7, F10 · Decisions: D1.7 C, D1.12 B, D2.1 B ·
Spec: specs/flows.md "Shape"

## Goal

`weave run <idea> --to flows` produces `01-flows/01-scope.json`, `01-flows/04-reconcile.json` and
their markdown, asking blocking questions on the terminal in interactive
mode.

## What this step does

1. **Two stages are registered**, `scope` and `flows`, so `--to scope`
   works alone.
2. **The scope stage** reads the idea and any saved answers, calls the model
   through the runner with the scope validator, writes the artifact and its
   markdown. In interactive mode it passes `ask` to the runner (step 53): after
   each new draft the blocking, unanswered questions are asked on the
   terminal, showing the default; the runner applies the answers in the next
   fix and returns them all, and the stage saves them so reruns reuse them.
3. **The flows stage** does the same with the scope as input and the flows
   validator.
4. **The stub stage from step 07 goes away.**
5. **Each stage has a review guide** (`review-scope.md`, `review-flows.md`
   beside its prompt: what a reviewer looks for and what it ignores) and
   passes it to the runner as `review` (step 51).
5. **A test with a fake model** runs both stages on a temp run.

After this step `weave run <idea> --to flows` produces a validated user-flow
spec from an idea.

## Implementation details

### `src/agents/01flows/stages.ts`

Two registered stages, so `--to scope` works on its own:

```ts
export const scopeStage: StageDef = { name: 'scope', produces: ['scope'], run: runScope };
export const flowsStage: StageDef = { name: 'flows', produces: ['flows'], run: runFlows };
```

`runScope(ctx)`:

1. `idea = loadPrompt(runPath(run, 'input/idea.md'))`; `answers = readAnswers(run)`
   (`input/answers.json`, `{}` when missing).
2. `runSpecStage({ stage: 'scope', schema: Scope, schemaName: 'Scope', system:
   scopeSystemPrompt(answers), user: scopeUserMessage(idea), validate:
   validateScope, llm })`.
3. `writeArtifact(run, 'scope', output, { stage: 'scope', model, rounds, inputs: [] })`;
   write `01-flows/01-scope.md`.
4. Interactive (`ctx.interactive`): for each question with `blocking: true`
   and no answer yet, print question, why it matters and the default; read a
   line with `node:readline/promises` (`rl.question`); empty input keeps the
   default. Save all answers to `input/answers.json`. The scope is not
   rerun; the answers reach the flows call and any later rerun of scope.

`runFlows(ctx)`: reads the scope envelope, same pattern with `Flows`,
`validateFlows(output, scope.data)`, `inputs: ['scope']`, renders
`01-flows/04-reconcile.md`. Register both in `src/agents/stages.ts` and delete the stub.

### Tests

`stage.test.ts` with a fake llm returning the reading-list fixtures: after
`runScope` and `runFlows` on a temp run, both artifacts exist with version 1,
`01-flows/04-reconcile.md` contains `## F0`, and `state.json` marks both stages done.

## Done when

```sh
pnpm weave run fixtures/ideas/freelancer-workspace.md --to flows
```

ends with zero mandatory issues within 3 rounds, or prints a readable
`StageFailed` report with the rule ids. `pnpm weave show <id>` lists both
stages with rounds, tokens and cost.

## Watch out

- The model's JSON is validated before it is written; a failed stage leaves
  no `01-flows/04-reconcile.json` behind.
- Keep the terminal prompts short; the defaults are what runs unattended.
