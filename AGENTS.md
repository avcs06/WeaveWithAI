# Agent rules

This repository builds **Weave**: a generator agent that turns an idea into a
deployable website, built on Meta's Muse models for the Meta Global AI Developer
Hackathon (submissions close 2026-11-05 07:30 IST).

| Path        | What it is                                                                                     | Who changes it                                       |
| ----------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `src/`      | The generator: CLI, stage runner, stages, validators, renderers                                | You, through tasks in `docs/PLAN.md`                 |
| `template/` | The design-system workspace (packages, web, server, tools). Copied into every generated app    | Only tasks that name `template/`                     |
| `mcps/`     | MCP servers, one folder each; `design-system` does design-system lookup and code validation    | Only tasks that name `mcps/`                         |
| `docs/`     | Plan, options, architecture, stage specs, one step file per task in `docs/steps/`              | Tick tasks in `PLAN.md`; never change decisions      |
| `fixtures/` | Reference idea briefs and golden artifacts used by tests and runs                              | Add files; don't rewrite existing ones               |
| `runs/`     | Output of generator runs (gitignored)                                                          | Written by the generator only                        |

## How to work

All work happens on the `hackathonv3` branch, or on short-lived branches merged
back into it. `hackathon` (the design system) and `hackathonv2` (the
restructure) stay as they are.

1. New session: read `docs/README.md`, then `docs/PLAN.md`. The next task is
   the first unticked one whose dependencies are ticked; its step file is
   `docs/steps/NN-<id>-<slug>.md`.
2. Wait for the user's go on that step file. They read it first and may change
   it; the step file as it is when they say go is the task.
3. Before coding, read the spec sections and the decisions the step names in
   `docs/OPTIONS.md`. A decision where nothing is ticked uses the option marked
   **(default)**.
4. Do only that step. Work you discover goes in as a new unticked task in
   `PLAN.md`, with one line saying why. Don't do it now.
5. Run every check in the step's **Done when**. All must pass.
6. Tick the task in `PLAN.md` (`- [x]`, ` (done YYYY-MM-DD)` on its title line).
   Never stage or commit: leave every change unstaged. The user reviews, stages
   and commits as `<task id>: <what changed>`.
7. Blocked: leave it unticked, add an indented `> Blocked: <what and why>` line
   under it, and stop for the user.

## Rules

- Node 22.18+, TypeScript strict, ESM. Run `src/` with `tsx`; there is no build step.
- No agent frameworks (LangChain, LangGraph, Mastra and the like). The
  orchestrator is plain TypeScript you can read top to bottom.
- Every model call goes through `src/core/llm.ts`. Product runs use Meta's
  models only: the Meta Model API by default, or Meta open-weight models (Muse
  Spark Open, Muse Glimmer) served on Modal or locally, chosen with
  `LLM_BACKEND` (D1.11). Meta tooling is 25% of the score and the open-weight
  run qualifies for a bonus prize. Another vendor's models are allowed only
  behind env vars for local experiments, never as a default.
- Tests never touch the network. Use the replay cache in `src/core/llm.ts`, a
  fake client, or fixtures.
- Artifacts are JSON validated by zod schemas in the stage's `schema.ts`.
  Never parse free text from a model.
- Validators are pure functions: artifacts in, `Issue[]` out. No I/O, no model
  calls. A model-based review lives in a separate reviewer and only produces
  warnings.
- Every validator rule has an id (`FLOW-007`), a severity (`mandatory` or
  `warning`), and a unit test with one passing and one failing fixture.
- Never weaken a rule, threshold, fixture or test to make a run pass. If a rule
  is wrong, add a task saying why and stop for the user.
- Prompts live in `.md` files beside their stage. Code only fills
  `{{placeholders}}`; no prompt prose inside TypeScript.
- One stage per folder: `schema.ts`, `prompt*.md`, `validate.ts`,
  `validate.test.ts`, `render.ts`, `stage.ts`. Keep files under about 300 lines.
- `template/` and each MCP in `mcps/` keep their own tooling (pnpm and Nx in
  `template/`, npm in the MCPs). Never add them to a root workspace. Run their commands with
  `pnpm --dir template <script>`.
- `template/tools/weave-design-system-mcp` is a symlink to
  `../../mcps/frontend`. Keep it.
- Never put a `tsconfig.json` at the repo root: the template's `ts-node` finds
  it by searching upward and `pnpm mcp:check` breaks. The agent's config is
  `src/tsconfig.json`.
- Generated apps have no backend and no deployment this week (pivot
  2026-10-28): the frozen contract becomes a mock API inside the app
  (OPTIONS.md 6M), and a benchmark stage (section 13) measures the frontend.
- Code the generator writes into an app is recorded in the app's ledger with
  its origin; a model session may write only inside the paths its step allows,
  and never a test.
- Secrets only in `.env` (gitignored), loaded with `process.loadEnvFile()`.
- Docs you write: short plain sentences, no em dashes.
