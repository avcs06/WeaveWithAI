# 07 · F7 CLI

Phase 1 · 30 min · Depends: F6 · Decisions: D1.7 C, D1.9 · Spec:
ARCHITECTURE.md "Principles" (resumable)

## Goal

`weave run`, `validate`, `show`, `ds` and `bench`: one entry point that
walks the stage registry in pipeline order, reruns stale stages and prints
what happened.

## What this step does

1. **A registry of stages in pipeline order**, each saying which artifacts
   it produces. Later steps add their stage to it; a stub scope stage stands
   in until step 13.
2. **`weave run <idea>`** creates or reuses a run, then walks the stages up
   to `--to`: a stage already done and not stale is skipped; `--from`
   forces a rerun; `--interactive`, `--no-replay` and `--backend` are
   passed through.
3. **`weave validate`** reruns the validators on the artifacts on disk
   without any model call. **`weave show`** prints a stage table and the
   totals (calls, tokens, cost). `ds` and `bench` are placeholders for
   later steps.
4. **Failures read well**: a failed stage prints its issues and the report
   path and exits with code 1; a wrong argument exits with 2.
5. **Tests** call the command functions on a temp folder with a fake model.

After this step the generator has a front door and the resume behaviour
every later stage relies on.

## Implementation details

### 1. `src/agents/stages.ts`: the registry

```ts
export type StageContext = {
  run: Run;
  config: Config;
  llm: ReturnType<typeof createLlm>;
  interactive: boolean;
  backend: string;          // step 08
};
export type StageDef = {
  name: string;             // 'scope' | 'flows' | 'design' | 'contract' | 'reconcile' | 'freeze' | 'scaffold' | 'codegen' | 'apitest' | 'frontend' | 'bench' | 'e2e' | 'repair'
  produces: ArtifactName[]; // for staleness; [] for stages that write other files
  run(ctx: StageContext): Promise<void>;
};
export const PIPELINE: string[] = ['scope', 'flows', 'design', 'contract', 'reconcile', 'freeze', 'scaffold', 'codegen', 'apitest', 'frontend', 'bench', 'e2e', 'repair'];
export const stages: StageDef[] = [ /* registered as steps land; a stub 'scope' now */ ];
```

The stub `scope` stage writes a placeholder `01-flows/01-scope.json` through
`writeArtifact` so `show` has something to list; step 13 replaces it.

### 2. `src/cli.ts`

`node:util` `parseArgs` with `allowPositionals`. Commands:

- `run <idea.md> [--run <id>] [--from <stage>] [--to <stage>] [--interactive] [--no-replay] [--backend <name>]`
  1. `createRun` (or `openRun` with `--run`; then `input/idea.md` is kept).
  2. For each stage in `PIPELINE` up to `--to` (default: the last registered):
     skip when `state.stages[name].status === 'done'` and none of its
     `produces` is stale and `--from` hasn't been reached; otherwise run it.
     Unknown `--to`/`--from` → exit 2 with the list of known stages.
  3. `--no-replay` sets `config.LLM_REPLAY = false` for this process.
  4. On `StageFailed`: print `formatForTerminal(issues)` and the report path,
     exit 1. Other errors: message and exit 1.
- `validate <runId> [stage]`: runs the registered validators on the
  artifacts on disk, no model calls; exit 1 on mandatory issues.
- `show <runId>`: a table (stage, status, version, rounds, updated) from
  `state.json`, then totals from `events.jsonl`: calls, tokens in/out, cost.
  `--html` is added by step 59.
- `ds`: placeholder until step 15. `bench <runId>`: placeholder until step 54.

Print with plain `console.log` and padded columns; no CLI framework.

### 3. `package.json`

`"weave": "tsx src/cli.ts"` already exists. Add nothing else.

### 4. `src/cli.test.ts`

Call the command functions directly (export `runCommand`, `showCommand`)
with a temp `runsDir` and a fake llm: `run --to scope` creates
`runs/<id>/input/idea.md`, `01-flows/01-scope.json`, `state.json`; a second `run --run
<id> --to scope` skips the stage (no new version); `show` output contains the
stage name and `done`.

## Done when

```sh
pnpm weave run fixtures/ideas/freelancer-workspace.md --to scope   # prints the run id, stage lines
pnpm weave show <id>                                           # table with scope done, totals 0
pnpm test -- src/cli.test.ts
```

## Watch out

- Keep stage names stable: `--from`/`--to`, `state.json` and the step files
  all use them.
- Exit codes: 0 ok, 1 failed stage or error, 2 usage.
