# 41 · FE1 Muse Code runner

Phase 7 · 1.5 h · Depends: FE8, S1 · Decision: D9.1 A (user, 2026-11-01) ·
Spec: ARCHITECTURE.md "Principles" 6 and 7

## Goal

Run one coding session on Muse Code headless inside a generated app, then
judge the result ourselves: the checks rerun by our code, the git diff in
the ledger, and the session failed when it touched what it must not.

## What this step does

1. **The app is prepared once**: `.mcp.json` names the design-system MCP
   (and the app MCP once FE10 exists), `.muse/hooks.json` runs MCP validate
   after every file the agent writes and sends the findings back to it,
   `.weave/guidelines.md` is copied from `src/engine/guidelines.md` (FE9),
   and a git baseline is committed in the app.
2. **A session gets a short task and its input files**: `.weave/tasks/<id>.md`
   names the input files in `.weave/` and the guidelines; the stage that
   starts the session writes those inputs.
3. **Muse Code runs headless** on the backend `LLM_BACKEND` names: the Meta
   API, Muse Spark Open on Baseten, or Muse Glimmer on Modal. The model is
   always pinned and contributor mode is always off.
4. **Usage comes from its JSONL events**: tokens per kind and cost go into
   the run's events, as any stage's calls do.
5. **The gate does not trust the agent**: it reruns MCP validate on every
   changed file, typecheck, lint and `pnpm verify <route>`, records the diff
   in the ledger with origin `model`, and fails the session when the diff
   touches a test or a generated folder. A passing session is committed in
   the app, so the next diff starts clean.

## Before you start

- What FE8 learned (2026-11-01):
  - `muse exec --json --trust-workspace --api-key-stdin --contributor-mode off
    --model <id> --max-model-steps <n> --prompt-file <file>`. Without
    `--trust-workspace`, `AGENTS.md`, `.mcp.json` and the hooks are skipped.
  - Baseten and Modal: `-c endpoint_transport={"base_url":<url>,"auth":"bearer"}`
    and the key on stdin; a bare `--base-url` keeps the key back (401).
  - MCP servers load from `.mcp.json` (Claude Code format); hooks from
    `.muse/hooks.json`: `{ "schema_version": 1, "hooks": { "PostToolUse":
    [{ "matcher": ".*", "hooks": [{ "type": "command", "command": … }] }] } }`.
  - The hook's stdin: `{ hook_event_name, tool_name, tool_input: { path },
    tool_response, session_id, model, cwd }`. Exit 2 with stderr sends the
    message back to the agent.
  - JSONL events: `run.usage` (`payload.models[]`: `calls`, `input_tokens`,
    `cached_tokens`, `output_tokens`, `reasoning_tokens`, `model`),
    `run.terminal.completed` and `run.terminal.failed` (`payload.text`),
    `tool.result` (`payload.correlation_facts.tool_name`, `outcome`).
  - The user's global Muse Code settings default to `muse-wonder-full-1.0`
    with contributor mode on; never rely on them.
- Prices: `src/core/prices.ts` (Meta and Baseten per token; Modal is GPU time
  and reports $0).

## Implementation details

### `src/engine/`

```ts
// setup.ts
export function prepareApp(appDir: string): void;   // .mcp.json, .muse/hooks.json, .weave/hooks/validate-edit.mjs, .weave/guidelines.md, git baseline

// muse.ts
export function museArgs(backend: Backend, session: Session): { args: string[]; key: string };   // pinned model, endpoint_transport off Meta
export function readUsage(jsonl: string): { calls: number; input: number; cached: number; output: number; reasoning: number; model: string; summary: string; completed: boolean };

// session.ts
export type Session = {
  id: string;              // 'page:S04', 'component:WidgetBoard', 'repair:R03'
  task: string;            // the short prompt; names .weave files and the guidelines
  inputs: Record<string, unknown>;   // written to .weave/ before the run
  route?: string;          // for pnpm verify
  protect?: string[];      // globs the diff must not touch; tests always
  maxSteps?: number;       // 60
  timeoutMs?: number;      // 30 min
};
export type SessionResult = {
  status: 'done' | 'failed' | 'checks' | 'protected' | 'timeout';
  summary: string; changed: string[];
  usage: { calls: number; input: number; cached: number; output: number; reasoning: number };
  costUsd: number;
  checks: { name: string; ok: boolean; output: string }[];
};
export async function runSession(ctx: StageContext, appDir: string, session: Session): Promise<SessionResult>;
```

- The muse executable is `MUSE_BIN` from `.env`, else `muse`; tests point it
  at a fake.
- The JSONL goes to `runs/<id>/sessions/<session id>.jsonl`; events
  `session:start` and `session:end` (status, usage, cost).
- Ledger: `.weave/ledger.json` in the app, one entry per changed path:
  `{ path, origin: 'model', session, status: 'A' | 'M' | 'D' }`.
- Sessions run one at a time: `pnpm verify` uses port 3001 and typecheck
  covers the whole app.

### Tests (`session.test.ts`, a temp app with git, a fake `muse`)

The fake is a node script that writes files named in an env var and prints
JSONL lines (`run.usage`, `run.terminal.completed`), with no network.

1. Usage and cost are read from the fake's events.
2. The diff is recorded in the ledger with origin `model`.
3. A fake that writes `x.test.tsx` fails the session with `protected`.
4. A failing check (a fake runner) fails the session with `checks`.
5. `museArgs` per backend: Meta with the pinned model; Baseten and Modal
   with `endpoint_transport` and their key.

## Done when

```sh
pnpm test -- src/engine
```

and one real session on the FE8 trial app passes its gate (with the user's
go: it spends credits).
