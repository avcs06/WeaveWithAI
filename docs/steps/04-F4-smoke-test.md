# 04 · F4 Smoke test

Phase 1 · 15 min · Depends: F3 · Decisions: D1.4 A · Spec: ARCHITECTURE.md
"Model layer"

## Goal

One real call that proves the API key, the base URL, the schema bridge and
the client agree, using every schema construct the stages use.

## What this step does

1. **A script makes one real call** with a toy schema that uses every
   construct the stages use: nested arrays, an enum, a nullable number, a
   discriminated union.
2. **It prints** the parsed object, tokens in and out, cost and timing.
3. **If the API rejected anything**, the bridge (step 02) is fixed and the
   finding goes into ARCHITECTURE.md, so the stages are written against a
   known-good shape.

After this step the key, the base URL, the bridge and the client are known
to work together.

## Before you start

- `.env` has a working `MODEL_API_KEY` and the Meta credits are applied to
  the account (a card must be on file for calls to go through).
- The call costs well under a cent. `LLM_REPLAY` is read from `.env`; the
  smoke test forces replay off so it always hits the API.

## Implementation details

### `src/smoke.ts`

```ts
import { z } from 'zod';
import { loadEnv } from './core/env';
import { createLlm } from './core/llm';

const Shape = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('circle'), radius: z.number() }),
  z.object({ kind: z.literal('rect'), width: z.number(), height: z.number() }),
]);
const Toy = z.object({
  title: z.string(),
  mode: z.enum(['draft', 'final']),
  tags: z.array(z.string()),
  items: z.array(z.object({ name: z.string(), qty: z.number().int(), note: z.string().nullable() })),
  shape: Shape,
});

const config = { ...loadEnv(), LLM_REPLAY: false };
const llm = createLlm({ config });
const result = await llm.generateStructured({
  stage: 'smoke', round: 1, schema: Toy, schemaName: 'Toy',
  messages: [
    { role: 'system', content: 'Return a small realistic example object that matches the schema.' },
    { role: 'user', content: 'A toy inventory for a corner shop.' },
  ],
});
console.log(JSON.stringify(result.data, null, 2));
console.log(`${result.backend}/${result.model}: ${result.usage.input} in, ${result.usage.output} out, $${result.costUsd.toFixed(5)}, ${result.durationMs} ms`);
```

Exit non-zero on any thrown error (top-level await in an ESM file run by
`tsx` does that by default; print the error message first).

Step 08 adds `--backend <name>` to this script; leave a `parseArgs` stub
with no options now so the flag can be added without reshaping the file.

## Done when

```sh
pnpm smoke
```

prints a parsed object with all five fields and the usage line. If the API
rejected the schema, fix the bridge (step 02) and add a note to
ARCHITECTURE.md "Model layer" saying what changed and why.

## Watch out

- A 401 means the key; a 404 on `/chat/completions` means `LLM_BASE_URL`.
- If the response is valid JSON but fails the zod parse, the bridge or the
  model is lax about `nullable` or the union: record which construct failed.
