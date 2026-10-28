# 03 · F3 Model client

Phase 1 · 60 min · Depends: F2 · Decisions: D1.3 A, D1.4 A, D1.8 B, D1.9 A ·
Spec: ARCHITECTURE.md "Model layer"

## Goal

The only place that talks to a model: one function that sends a structured
request, retries sensibly, parses with the zod schema, prices the call,
records it for audit and replays identical requests for free.

## What this step does

1. **One function, `generateStructured`, that every stage calls.** It takes
   the conversation so far and a zod schema, and returns an object that
   matches the schema. No stage ever builds an HTTP request itself.
2. **The request asks for constrained output** (`response_format: json_schema`),
   so the model can only answer in the schema's shape.
3. **Trouble is handled in one place**: rate limits and server errors wait and
   retry (honouring the API's `Retry-After`); an answer cut short by the
   output limit is retried once with a bigger limit; anything else fails with
   the status and the API's message.
4. **The answer is parsed and checked against the schema.** A mismatch means
   the bridge and the model disagree, which must surface, not be patched over.
5. **Every call is priced** from the token counts with Meta's price table and
   returned with the result, so costs are tracked per call.
6. **Replay cache**: when `LLM_REPLAY` is on, an identical request returns
   the recorded answer without a call. Iterating on validators and renderers
   is then free; changing a prompt or schema changes the key, so stale
   answers can't come back.
7. **An audit file per call** is written under the run, with the request, the
   answer, usage and timing.
8. **Tests use a fake client**; nothing here touches the network in tests.

After this step the whole generator has one model client with retries,
pricing, replay and audit built in.

## Before you start

- `openai@7` is installed (step 01). Its `APIError` carries `status` and
  `headers` (a `Headers`). Set `maxRetries: 0` on the client so the retry
  policy here is the only one.
- Prices (docs/README.md): `muse-spark-1.3` $1.25 in, $0.15 cached in, $4.25
  out per 1M tokens; `muse-wonder-1.0` $4 in, $20 out. Unknown models cost 0
  and log a warning event.

## Implementation details

### 1. `src/core/prices.ts`

```ts
export type Price = { input: number; cachedInput: number; output: number }; // USD per 1M tokens
export const PRICES: Record<string, Price> = {
  'muse-spark-1.3': { input: 1.25, cachedInput: 0.15, output: 4.25 },
  'muse-wonder-1.0': { input: 4, cachedInput: 4, output: 20 },
};
export type Usage = { input: number; cachedInput: number; output: number };
export function costUsd(model: string, usage: Usage): number;   // 0 for unknown models
```

### 2. `src/core/llm.ts`

```ts
import OpenAI from 'openai';
import type { z } from 'zod';
import { toJsonSchema } from './schema';
import type { Config } from './env';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
export type ModelChoice = 'default' | 'strong';

export type GenerateInput<T> = {
  stage: string;
  round: number;
  schema: z.ZodType<T>;
  schemaName: string;
  messages: ChatMessage[];
  model?: ModelChoice;        // default 'default'
  maxTokens?: number;         // default 8192
  runDir?: string;            // when given, writes llm/<stage>-r<round>.json
};

export type GenerateResult<T> = {
  data: T;
  raw: string;
  usage: { input: number; cachedInput: number; output: number };
  costUsd: number;
  replayed: boolean;
  backend: string;            // 'meta' until step 08 adds others
  model: string;
  durationMs: number;
};

export class ModelRequestFailed extends Error { constructor(msg: string, public status?: number) }
export class ModelOutputTruncated extends Error {}
export class ModelOutputInvalid extends Error { constructor(msg: string, public issues: unknown) }

export type LlmDeps = {
  config: Config;
  client?: Pick<OpenAI['chat']['completions'], 'create'>;  // injectable fake for tests
  replayDir?: string;         // default '.weave-cache/replay'
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
};

export function createLlm(deps: LlmDeps): { generateStructured<T>(input: GenerateInput<T>): Promise<GenerateResult<T>> };
```

Behaviour of `generateStructured`:

1. Resolve the model: `'default'` → `LLM_MODEL`, `'strong'` → `LLM_MODEL_STRONG`.
2. Bridge the schema with `toJsonSchema(schema, schemaName)` (step 02).
3. Replay key: `sha256` of the canonical JSON (sorted keys) of
   `{ backend, model, messages, schema }`. If `LLM_REPLAY` and
   `<replayDir>/<key>.json` exists, return its recorded content with
   `replayed: true` and `costUsd: 0` (keep the recorded usage).
4. Request:
   ```ts
   client.create({
     model, messages, temperature: 0.2, max_tokens: maxTokens,
     response_format: { type: 'json_schema', json_schema: { name: schemaName, schema } },
   })
   ```
5. Retries: on `APIError` with status 429 or 500 to 599, or a network error,
   wait and retry up to 5 attempts. Delay = `Retry-After` when present
   (seconds, or an HTTP date minus now), else `min(30_000, 1000 * 2 ** attempt)`
   plus up to 250 ms of jitter. Other statuses throw `ModelRequestFailed`
   immediately with the status and the API's message.
6. `finish_reason === 'length'`: retry once with `max_tokens * 2` (capped at
   16_384), then throw `ModelOutputTruncated`.
7. Parse `choices[0].message.content` with `JSON.parse`, then
   `schema.safeParse`; failure throws `ModelOutputInvalid` with the zod issues
   (rare under constrained decoding; it means the bridge and the model
   disagree, which must surface).
8. Usage from `usage.prompt_tokens`, `usage.completion_tokens`,
   `usage.prompt_tokens_details?.cached_tokens ?? 0`; cost with `costUsd`.
9. Write the replay file (request, content, finish reason, usage, createdAt)
   and, when `runDir` is given, `runDir/llm/<stage>-r<round>.json` with the
   request (messages, schema name, model), the response text, usage, cost,
   `replayed` and `durationMs`. The caller (step 06) logs the event.

Use `node:crypto` `createHash('sha256')`. Keep the canonical JSON helper here
for now; step 05 moves it to `artifacts.ts` and this file imports it.

### 3. `src/core/llm.test.ts`

A fake `create` that pops scripted results from an array (a response object,
or an `OpenAI.APIError` built with `new OpenAI.APIError(429, { message }, 'rate
limited', new Headers({ 'retry-after': '0' }))`). Inject `sleep` to record
delays and `replayDir` as a temp folder. Cases:

1. Success: `data` parsed, `usage` and `costUsd` right for spark prices
   (100 in, 20 cached, 50 out → compute by hand), `replayed: false`.
2. 429 with `retry-after: 0`, then success: two `create` calls, one recorded
   sleep of 0 ms.
3. `finish_reason: 'length'` then success: the second request's `max_tokens`
   is doubled.
4. `'length'` twice: throws `ModelOutputTruncated`.
5. Replay: same input twice with `LLM_REPLAY: true` → the second call makes
   no request and returns `replayed: true`; with a different message it
   requests again.
6. Status 400: throws `ModelRequestFailed` with `status === 400`, one call.
7. Invalid content (`'{"wrong": 1}'` against a schema needing `title`):
   throws `ModelOutputInvalid`.

## Done when

```sh
pnpm test -- src/core/llm.test.ts   # 7 passing, no network
pnpm typecheck
```

## Watch out

- Never log `MODEL_API_KEY`; the audit file holds no headers.
- `temperature: 0.2` is a start; the stages may pass their own later through
  a `temperature` field on `GenerateInput`, add it when needed.
