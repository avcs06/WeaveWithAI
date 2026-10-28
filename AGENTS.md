# Agent rules

This repository builds **Weave**: a generator agent that turns an idea into a
deployable website, built on Meta's Muse models for the Meta Global AI Developer
Hackathon (submissions close 2026-11-05 07:30 IST).

| Path        | What it is                                                                                     | Who changes it                                       |
| ----------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `src/`      | The generator: CLI, stage runner, stages, validators, renderers                                | You, through tasks in `docs/PLAN.md`                 |
| `template/` | The design-system workspace (packages, web, server, tools). Copied into every generated app    | Only tasks that name `template/`                     |
| `mcps/`     | MCP servers, one folder each; `design-system` does design-system lookup and code validation    | Only tasks that name `mcps/`                         |
| `docs/`     | Plan, options, architecture, stage specs                                                       | Tick tasks in `PLAN.md`; never change decisions      |
| `fixtures/` | Reference idea briefs and golden artifacts used by tests and runs                              | Add files; don't rewrite existing ones               |
| `runs/`     | Output of generator runs (gitignored)                                                          | Written by the generator only                        |

## How to work

All work happens on the `hackathonv3` branch, or on short-lived branches merged
back into it. `hackathon` (the design system) and `hackathonv2` (the
restructure) stay as they are.

1. New session: read `docs/README.md`, then open `docs/PLAN.md` and take the
   first unticked task whose dependencies are ticked.
2. Before coding, read the spec sections the task links and the decisions it
   names in `docs/OPTIONS.md`. A decision where the user ticked nothing uses the
   option marked **(default)**.
3. Do only that task. Work you discover goes in as a new unticked task under
   the current phase, with one line saying why. Don't do it now.
4. Run every check in the task's **Done when**. All must pass.
5. Tick the task (`- [x]`), append ` (done YYYY-MM-DD)` to its title line, and
   commit: `git commit -m "<task id>: <what changed>"`.
6. Blocked: leave it unticked, add an indented `> Blocked: <what and why>` line
   under it, and continue with the next task that doesn't depend on it.

## Rules

- Node 22.18+, TypeScript strict, ESM. Run `src/` with `tsx`; there is no build step.
- No agent frameworks (LangChain, LangGraph, Mastra and the like). The
  orchestrator is plain TypeScript you can read top to bottom.
- Every model call goes through `src/core/llm.ts`. Product runs call the Meta
  Model API (Muse models): this is a hackathon rule and 25% of the score.
  Another provider is allowed only behind env vars for local experiments,
  never as a default.
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
  `../../mcps/design-system`. Keep it.
- Never put a `tsconfig.json` at the repo root: the template's `ts-node` finds
  it by searching upward and `pnpm mcp:check` breaks. The agent's config is
  `src/tsconfig.json`.
- Secrets only in `.env` (gitignored), loaded with `process.loadEnvFile()`.
- Docs you write: short plain sentences, no em dashes.
