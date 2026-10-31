# 01 · F1 Root package and tooling

Phase 1 · 20 min · Depends: M3 · Decisions: D1.2 (zod), D1.3 (`openai` SDK) ·
Spec: ARCHITECTURE.md "Code layout"

## Goal

Install the generator's dependencies at the root, load and validate `.env`
in one place, and have `pnpm typecheck` and `pnpm test` pass on a first test.

## What this step does

1. **Install the generator's libraries at the root.** Four for running:
   `openai` (the client that speaks the Meta Model API's protocol; every call
   goes to `api.meta.ai`), `zod` (schemas that validate data and are also
   turned into the JSON Schema sent to the model), `execa` (runs the
   template's scripts and the generated app's checks as child processes),
   `p-limit` (caps how many model calls run at the same time). Four for
   developing: TypeScript, `tsx` (runs TypeScript directly, no build step),
   `vitest` (the test runner), Node's types.
2. **Add one place that reads configuration: `src/core/env.ts`.** When the
   generator starts, it reads `.env` if the file exists, checks every variable
   it needs (the API key must be set; the base URL must be a URL; the model
   names and the replay flag get defaults when missing), and hands the rest of
   the code one typed `config` object. A missing or wrong variable stops the
   process at startup with a message naming the variable, instead of failing
   in the middle of a run.
3. **Test it** with four cases: a valid `.env` file, a missing key, the replay
   flag set to false, a bad URL.
4. **Create your `.env`** from `.env.example` and set the key. Git ignores it.

After this step `pnpm typecheck` and `pnpm test` work, and every later step
reads its settings through `config()`.

## Before you start

- Root `package.json` has scripts but no dependencies. `vitest.config.ts`
  already includes `src/**/*.test.ts`. `src/tsconfig.json` is the only
  TypeScript config at the root; never add one at the repository root (the
  template's `ts-node` finds it and `pnpm mcp:check` breaks).
- `.env.example` lists `MODEL_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`,
  `LLM_MODEL_STRONG`, `LLM_MODEL_VISION`, `LLM_REPLAY`. Step 08 adds the
  backend variables.
- The root is not a pnpm workspace and must stay that way (AGENTS.md); the
  template keeps its own lockfile.

## Implementation details

### 1. Dependencies

```sh
pnpm add openai@^7.45.1 zod@^4.6.7 execa@^10.2.1 p-limit@^7.3.3
pnpm add -D typescript@~5.9.0 tsx@^4.23.15 vitest@^5.0.5 @types/node@^22
```

A root `pnpm-lock.yaml` appears; it is tracked. `node_modules` is ignored by
the root `.gitignore`. TypeScript 5.9 matches the template and the MCP.

### 2. `src/core/env.ts`

One schema, one loader, one memoized accessor.

```ts
import { existsSync } from 'node:fs';
import { z } from 'zod';

// zod 4: `.default()` short-circuits before parsing, so a transformed enum
// needs `.prefault()` for the raw default to go through the transform.
const Flag = z.enum(['true', 'false']).prefault('true').transform((v) => v === 'true');

export const ConfigSchema = z.object({
  MODEL_API_KEY: z.string().min(1, 'set it in .env (copy .env.example)'),
  LLM_BASE_URL: z.url().default('https://api.meta.ai/v1'),
  LLM_MODEL: z.string().default('muse-spark-1.3'),
  LLM_MODEL_STRONG: z.string().default('muse-wonder-1.0'),
  LLM_MODEL_VISION: z.string().default('muse-spark-1.3'),
  LLM_REPLAY: Flag,
});
export type Config = z.infer<typeof ConfigSchema>;

export function loadEnv(options: { file?: string; env?: NodeJS.ProcessEnv } = {}): Config {
  const file = options.file ?? '.env';
  // Node 22+: fills process.env from the file without overriding keys already set.
  if (existsSync(file)) process.loadEnvFile(file);
  const parsed = ConfigSchema.safeParse(options.env ?? process.env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid environment:\n${lines.join('\n')}`);
  }
  return parsed.data;
}

let cached: Config | undefined;
/** The process's config, loaded once. Tests call `loadEnv` directly. */
export const config = () => (cached ??= loadEnv());
```

Unknown keys in `process.env` are fine: `z.object` strips them.

### 3. `src/core/env.test.ts`

Vitest, no network. Each case clears `process.env.MODEL_API_KEY` first
(`delete process.env.MODEL_API_KEY`) because `loadEnvFile` never overrides.

1. A temp `.env` (`fs.mkdtempSync(path.join(os.tmpdir(), 'weave-'))`) with
   `MODEL_API_KEY=k1`: `loadEnv({ file })` returns `MODEL_API_KEY: 'k1'`,
   `LLM_MODEL: 'muse-spark-1.3'`, `LLM_REPLAY: true`.
2. No file and no key: throws, message contains `MODEL_API_KEY`.
3. `env: { MODEL_API_KEY: 'k', LLM_REPLAY: 'false' }`: `LLM_REPLAY === false`.
4. `env: { MODEL_API_KEY: 'k', LLM_BASE_URL: 'not a url' }`: throws naming `LLM_BASE_URL`.

### 4. `.env`

`cp .env.example .env`, set `MODEL_API_KEY`. `.env` is ignored by git; check
with `git check-ignore .env`.

## Done when

```sh
pnpm typecheck        # tsc -p src --noEmit: no errors
pnpm test             # vitest: src/core/env.test.ts, 4 passing
git status --short    # shows package.json, pnpm-lock.yaml, src/core/*; no .env
```

## Watch out

- `z.url()` is the zod 4 spelling; `z.string().url()` is deprecated.
- Keep `"type": "module"` in the root `package.json`; `tsx` runs ESM.
- Don't add `vitest/globals`; import `describe`, `it`, `expect` explicitly.
