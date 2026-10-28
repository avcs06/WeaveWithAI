# 41 · FE1 Coding engine: action loop with ownership and checks

Phase 7 · 2 h · Depends: F8, S2 · Decisions: D9.1 B (structured actions
instead of tool calling, so it runs on every backend), D7.4 · Spec:
ARCHITECTURE.md "Principles" 6 and 7

## Goal

The one way a model writes code in a generated app: a bounded loop where
each turn is a structured JSON of actions, every write is checked against
the session's allowed paths and recorded, and every check runs through the
app's own tools.

## What this step does

1. **A model writes code only through this loop.** Each turn the model
   answers with a JSON list of actions (read a file, write a file, list
   files, fetch a recipe, run a check, done); the loop executes them and
   sends the results back as the next message.
2. **Ownership is enforced by the loop, not by trust**: a session names the
   paths it may write; anything else, and any test file or generated folder,
   is refused and logged. Every accepted write goes into the ledger with its
   origin.
3. **Fast feedback**: every written file is validated by the design-system
   MCP immediately and the findings go back in the same results.
4. **Checks run through the app's own tools** (validate, typecheck, lint,
   tests, verify) and their output is fed back, capped so the context stays
   small.
5. **Bounded**: a turn limit and a token budget; the final checks named by
   the session must pass for the session to count as done, with at most two
   fix-up turns.
6. **Tests with a fake model** cover refusal, failing checks, done and the
   turn limit.

After this step the generator can let a model build files safely, on any
backend.

## Before you start

- The model layer (step 03) returns parsed objects for any zod schema; a
  turn is just another schema. No tool-calling API is needed, which keeps
  Modal and local backends in play.
- Checks in the app: `node tools/validate-files.mjs <files>` (MCP validate),
  `pnpm typecheck`, `pnpm exec eslint <files> --format json`,
  `pnpm nx test web -- --testPathPattern <p>`, `pnpm verify <route>` (it
  starts `pnpm dev` itself if the server isn't up).
- Recipes: the inventory's `recipes` list; the recipe files live in the app
  at the paths `designsystem.config.json` globs. If the exporter's recipe
  entries lack a `path`, extend `template/tools/export-design-system.mjs`
  to include it (template change).

## Implementation details

### 1. `src/engine/actions.ts`

```ts
export const Action = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('read'), path: z.string() }),
  z.object({ kind: z.literal('write'), path: z.string(), content: z.string() }),
  z.object({ kind: z.literal('list'), glob: z.string() }),
  z.object({ kind: z.literal('recipe'), component: z.string() }),
  z.object({ kind: z.literal('check'), name: z.enum(['validate', 'typecheck', 'lint', 'test', 'verify', 'e2e']), target: z.string().describe('route, test pattern or ""') }),
  z.object({ kind: z.literal('done'), summary: z.string() }),
]);
export const Turn = z.object({
  thinking: z.string().describe('One short paragraph: what you learned and what you do next'),
  actions: z.array(Action).min(1).max(8),
});
```

### 2. `src/engine/tools.ts`

```ts
export type CheckName = 'validate' | 'typecheck' | 'lint' | 'test' | 'verify' | 'e2e';
export type CheckResult = { ok: boolean; output: string; durationMs: number };
export function runAppCheck(run: Run, name: CheckName, target: string, files?: string[]): Promise<CheckResult>;  // execa in the app, output capped at 200 lines, logs check:run
export function readAppFile(run: Run, relPath: string): string;   // with line numbers, capped at 400 lines
export function listAppFiles(run: Run, glob: string): string[];
export function recipeText(inv: Inventory, run: Run, component: string): string | null;
```

### 3. `src/engine/loop.ts`

```ts
export type Session = {
  id: string;                 // 'page:S02', 'component:WidgetCanvas', 'repair:R03'
  stage: string;
  task: string;               // the user message: what to build, with specs and signatures
  allowWrite: string[];       // globs relative to the app, e.g. 'web/app/(routes)/projects/**'
  denyWrite?: string[];       // always: tests, web/app/api/**, web/app/entities/**, web/mocks/**, packages/**, web/e2e/**, unless listed in allowWrite explicitly
  origin: 'model' | 'repair';
  maxTurns?: number;          // 12
  maxTokens?: number;         // 200_000 total
  checksAtEnd: { name: CheckName; target: string }[];   // run after 'done'; failures become one more turn, at most twice
};
export type SessionResult = { status: 'done' | 'turns' | 'tokens' | 'checks' | 'failed'; summary: string; writes: string[]; refused: string[]; turns: number; usage: Usage; costUsd: number };
export async function runSession(ctx: StageContext, inv: Inventory, session: Session): Promise<SessionResult>;
```

Turn loop:

1. Messages: system = `src/engine/prompt-session.md` filled with the MCP
   instructions (`mcps/frontend/instructions.md`, read at run time), the
   DS summary, the allowed paths, the action format, and the rules (write
   complete files; run `validate` after every write; never write tests or
   generated folders; finish with `done`). User = `session.task`.
2. `generateStructured({ stage: `${session.id}:t${turn}`, schema: Turn })`.
3. Execute actions in order and build a results text:
   - `read` → the file with line numbers, or "not found".
   - `write` → if the path matches `denyWrite` and not `allowWrite`, or doesn't
     match `allowWrite`: `REFUSED <path>: outside this session's files` and
     record in `refused`; else `writeGenerated` (origin from the session) and
     immediately run `validate` on that file, appending its findings.
   - `list` → matching paths. `recipe` → the recipe text or the list of
     recipe names. `check` → `runAppCheck` output.
   - `done` → stop reading actions; run `checksAtEnd`; all ok → status
     `done`; else feed the failures back as a new turn (twice at most, then
     status `checks`).
4. Append the assistant's raw JSON and a user message `Results:\n…`; loop
   until done, `maxTurns` or `maxTokens`.
5. Events: `session:start`, `session:turn` (`actions`, `writes`, `refused`,
   `checks`), `session:end` (`status`, usage, cost). Audit files per turn
   through `runDir`.

Path matching: `path.matchesGlob` (Node 22.5+) on normalized relative
paths; reject `..` segments and absolute paths outright.

### 4. Tests (`loop.test.ts`, fake llm, temp app folder, fake check runner)

1. A write to `web/app/api/x.ts` with `allowWrite: ['web/app/(routes)/a/**']`
   → not on disk, `refused` has it, the next turn's user message contains
   `REFUSED`.
2. A `check: typecheck` whose fake runner fails → the next user message
   contains the runner's output.
3. `done` with passing `checksAtEnd` → status `done`, `writes` lists the
   file, the ledger has it with origin `model`.
4. Never `done` → status `turns` after `maxTurns`.
5. A write to `web/app/components/X/X.test.tsx` is refused unless
   `allowWrite` names it.

## Done when

```sh
pnpm test -- src/engine
```

and a manual session on the scaffolded project tracker
(`tsx src/engine/try.ts <runId> "Add a short welcome paragraph to the home page"`,
a tiny script you may keep) ends with `done` and `pnpm verify /` green.

## Watch out

- The results message can get long; cap each read at 400 lines and each
  check output at 200 lines, and say so in the system prompt.
- The system prompt is a `.md` file; code fills placeholders only.
