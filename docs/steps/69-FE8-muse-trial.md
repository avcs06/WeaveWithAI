# 69 · FE8 Muse Code trial on a golden app

Phase 7 · 1 h · Depends: C6, DS18 · Decision: D9.1 A

## Goal

Learn what a coding stage on Muse Code needs before building the runner:
one real screen built by Muse Code headless, in a scaffolded golden app, on
the Meta API and on Muse Spark Open through Baseten, with the result checked
by the app's own tools.

## What this step does

1. **A golden app is scaffolded** from the dashboard editor's golden run
   (NeonBoard) into `runs/20261101-0107-dashboard-editor/app`, with its theme
   applied. No Storybook starts.
2. **The agent's files go into the app**: `.weave/` holds the screen's design,
   the flow steps it serves, the contract's part for it and a first draft of
   the guidelines; the agent config adds the design-system MCP, a hook that
   runs MCP validate after every edit, and a trusted workspace.
3. **Muse Code builds one screen**: S04 `/dashboards` with its dialog S08
   (Delete dashboard). The prompt is short and names the files; the
   guidelines carry the detail. Data lives in an entity store made with
   `createStore`, as the template's MCP instructions say, since the mock API
   (S2, S3) does not exist yet.
4. **One run** on the Meta API (`muse-spark-1.3`), from the git baseline
   (user, 2026-11-01: limited credits). The open-weight endpoints are
   already proven by probes: Spark Open on Baseten and Glimmer on Modal call
   tools natively.
5. **The run is checked after** by the app's tools, and its usage, cost,
   time and diff are recorded.

## Before you start

- `src/agents/02design/01theme/preview/storybook.ts` `scaffoldApp(appDir)`
  copies the template with `generate.mjs --skip-setup` and installs; the MCP
  build (`pnpm mcp:setup` in the app) is left out, so run it.
  `apply.ts` `applyTheme(appDir, theme)` writes the theme.
- The golden run's artifacts: `fixtures/golden/dashboard-editor/` (the same
  data as run `20261101-0107-dashboard-editor`). S04's widgets are W07
  (Dashboards header) and W08 (Dashboard cards); S08's is W17.
- Muse Code 1.4.13: `muse exec --json --api-key-stdin --prompt-file <f>
  --model <id> --max-model-steps <n>`; Baseten through
  `-c endpoint_transport={"base_url":…,"auth":"bearer"}`. `muse init`
  scaffolds agent config in a workspace; read what it writes before writing
  the hook and MCP settings by hand.
- Checks in the app: `node tools/validate-files.mjs <files>`,
  `pnpm typecheck`, `pnpm nx lint web`, `pnpm verify /dashboards`.

## Implementation details

### 1. Scaffold

A throwaway script (not kept) calls `scaffoldApp` and `applyTheme` with the
golden theme, then `pnpm mcp:setup` in the app, `git init` and a baseline
commit.

### 2. `.weave/` in the app

- `.weave/screens/S04.json`: the screen, its sections, nodes, widgets and
  copy from `08-assemble.json`, and the same for S08.
- `.weave/flows.json`: the steps and alternatives S04 and S08 serve, with
  their fields.
- `.weave/contract.json`: the Dashboard entity, its operations, and the
  `widgets` entries of W07, W08 and W17.
- `.weave/guidelines.md`: the first draft of FE9's guidelines (data through
  an entity store in `web/app/entities/dashboard`, every state, forms
  through the Form recipe, `data-testid` per node, the H1, never tests, the
  checks that end the session).

### 3. The prompt (`.weave/task.md`)

> Build screen S04 (`/dashboards`) and its dialog S08 from
> `.weave/screens/S04.json`. Follow every guideline in
> `.weave/guidelines.md` and `AGENTS.md`. You are done when MCP validate,
> `pnpm typecheck`, `pnpm nx lint web` and `pnpm verify /dashboards` pass.

### 4. Runs

`muse exec --trust-workspace` (an untrusted workspace skips `AGENTS.md`,
the hooks and the MCP) with `--model muse-spark-1.3`,
`--contributor-mode off`, `--max-model-steps 60` and a 30-minute timeout,
JSONL to `runs/20261101-0107-dashboard-editor/trial/meta.jsonl`.

### 5. After each run

The four checks, the `run.usage` totals, wall time, cost (Meta prices from
`src/core/prices.ts`; tokens only for Baseten and Modal), the git diff
(files, lines, anything outside `web/app/(routes)/dashboards/**` and
`web/app/entities/**`), and whether the hook and the MCP were used.

## Done when

- The run is recorded in `runs/20261101-0107-dashboard-editor/trial/REPORT.md`.
- The user decides on the runner (FE1).

## Watch out

- No Storybook: `weave app` starts one on 6116; don't use it.
- Budget: one run. Never a second one to fix the first; record what failed.
- A config piece that won't work in about 20 minutes (hook, MCP, trust) is
  recorded and left out; the runs go ahead without it.
