# Agent rules

This repository builds **Weave**: a generator agent that turns an idea into a
deployable website, built on Meta's Muse models for the Meta Global AI Developer
Hackathon (submissions close 2026-11-05 07:30 IST).

| Path        | What it is                                                                                     | Who changes it                                       |
| ----------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `src/`      | The generator: CLI, runner, agents (one folder per stage), core. See "Where the code lives"   | You                                                  |
| `template/` | The design-system workspace (packages, web, server, tools). Copied into every generated app    | Only tasks that name `template/`                     |
| `mcps/`     | MCP servers, one folder each; `frontend` does design-system lookup and code validation         | Only tasks that name `mcps/`                         |
| `docs/`     | The benchmark spec                                                                             | Never change decisions                               |
| `fixtures/` | Reference idea briefs, and golden artifacts saved by `weave golden`                            | Add files; don't rewrite existing ones               |
| `runs/`     | Output of generator runs (gitignored)                                                          | Written by the generator only                        |

## Where the code lives

```text
src/
  cli.ts                 the weave command
  core/                  model client, artifacts, runs, issues, rule helpers, prompt loader
  runner/                running one stage: the rounds, reviewers and fixes (runSpecStage)
  ds/                    the design-system inventory the agents read
  checks/                rendered checks on a built app (DESIGN-R-001 to 017), in a real browser,
                         and the screenshot of each route the UX reviewer reads
  engine/                the Muse Code runner: app setup, one coding session, the gate after it
  agents/
    stages.ts            the pipeline order
    01flows/             scope, catalog, expand; the flow shapes and rules they share
    02design/            theme (with its brief), architect (frames, screens and dialogs in prose);
                         the config they share
    03contract/          the contract: the records and operations behind every screen
    04code/              scaffold, contract code, frames, pages; the unit runner and the code
                         reviewers they share
```

Each stage is a folder `<NN><name>` in its group, and a full pipeline stage
named `<group>-<name>` (`01flows/01scope` is `flows-scope`). It writes its
artifact to `<NN>-<group>/<NN>-<name>.json` in the run, with its markdown beside
it (`01-flows/01-scope.json`). Inside a stage folder:

```text
stage.ts       runs the stage and writes its artifact
schema.ts      the shape its call answers
render.ts      its markdown, when it writes one
prompts/       prompt.md, input.md, review-peer.md, review-output.md, index.ts (fills them)
validation/    validation.ts (the rule list), helpers.ts, rules/ (one file per rule)
```

Tests sit beside what they test. Code that several stages of a group share
sits in the group folder, never in a stage of its own: `01flows/schema.ts`,
`01flows/rules/`, `02design/config.ts`.

## How to work

All work happens on the `hackathonv3` branch, or on short-lived branches merged
back into it. `hackathon` (the design system) and `hackathonv2` (the
restructure) stay as they are.

1. Do only what was asked. Name work you discover to the user, with one line
   saying why. Don't do it now.
2. Run the checks that prove the work. All must pass.
3. Never stage or commit: leave every change unstaged. After each task, keep a
   snapshot of every file that differs from HEAD, outside the repo, so that
   once the user has reviewed, each task becomes its own commit even when
   later tasks touched the same files. The user says "commit"; the message is
   one line saying what changed.
4. Blocked: say what and why, and stop for the user.

## Rules

- Node 22.18+, TypeScript strict, ESM. Run `src/` with `tsx`; there is no build step.
- No agent frameworks (LangChain, LangGraph, Mastra and the like). The
  orchestrator is plain TypeScript you can read top to bottom.
- Every model call of the generator's own stages goes through
  `src/core/llm.ts`. The coding stages run Muse Code headless, which
  makes its own calls; the runner reads their usage from its JSONL events.
  Product runs use Meta's
  models only: the Meta Model API by default, or Meta open-weight models (Muse
  Spark Open, Muse Glimmer) served on Modal or Baseten, chosen with
  `LLM_BACKEND`. Meta tooling is 25% of the score and the open-weight
  run qualifies for a bonus prize. Another vendor's models are allowed only
  behind env vars for local experiments, never as a default.
- Tests never touch the network. Use the replay cache in `src/core/llm.ts`, a
  fake client, or fixtures.
- Artifacts are JSON validated by zod schemas in the stage's `schema.ts`.
  Never parse free text from a model.
- Validators are pure functions: artifacts in, `Issue[]` out. No I/O, no model
  calls. Model review is separate: on the fixed round schedule the
  stage runner asks reviewer calls for major blockers through a review
  schema; blockers join the fix rounds like mandatory issues, and whatever is
  left after the last round is recorded as known issues while the run
  continues. Reviewers ignore minor, low-impact and rare cases.
- Every validator rule has an id (`FLOW-007`), a severity (`mandatory` or
  `warning`), and a unit test with one passing and one failing fixture.
- Never weaken a rule, threshold, fixture or test to make a run pass. If a rule
  is wrong, say why and stop for the user.
- Prompts live in `.md` files in their stage's `prompts/` folder. Code only
  fills `{{placeholders}}`; no prompt prose inside TypeScript.
- One stage per folder, laid out as in "Where the code lives". Keep files under
  about 300 lines.
- `template/` and each MCP in `mcps/` keep their own tooling (pnpm and Nx in
  `template/`, npm in the MCPs). Never add them to a root workspace. Run their commands with
  `pnpm --dir template <script>`.
- `template/tools/weave-design-system-mcp` is a symlink to
  `../../mcps/frontend`. Keep it.
- Never put a `tsconfig.json` at the repo root: the template's `ts-node` finds
  it by searching upward and `pnpm mcp:check` breaks. The agent's config is
  `src/tsconfig.json`.
- Generated apps have no backend and no deployment: the contract becomes
  entity stores inside the app, and a planned benchmark stage
  (`docs/specs/benchmark.md`) will measure the frontend.
- Code the generator writes into an app is recorded in the app's ledger with
  its origin. A Muse Code session may change any app file, the design system
  and the entities included, but tools, config and tests. The runner records its
  git diff in the ledger, commits it with a patch in the run whether it passed
  or not, and fails the session when the diff touches a test or a protected
  path.
- Secrets only in `.env` (gitignored), loaded with `process.loadEnvFile()`.
- Docs you write: short plain sentences, no em dashes.
