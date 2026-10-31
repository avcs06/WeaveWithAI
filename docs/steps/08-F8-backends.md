# 08 · F8 Open-weight model backends

Phase 1 · 2 h · Depends: F4, F7 · Decisions: D1.11 (A, B, D ticked) · Spec:
ARCHITECTURE.md "Model layer"

## Goal

Run the same pipeline on Meta's open-weight models through Modal's and
Baseten's hosted endpoints (the runs that count for the open-weights
prize), by switching one variable. No stage code knows which backend it runs
on.

## What this step does

1. **Three backends, one switch.** `LLM_BACKEND=meta|modal|baseten` picks
   where calls go; each backend has its own base URL, key and model
   variables. The default stays the Meta Model API.
2. **The model client builds its HTTP client from the chosen backend**; the
   backend's name travels with every event, audit file and replay key, so a
   Modal run never replays a Meta recording and the dashboard can say which
   run used which.
3. **Modal and Baseten** host the models behind OpenAI-compatible
   endpoints: Muse Glimmer 30B on a Modal Dedicated Endpoint (GPU time from
   the Modal credits; `modal endpoint create`, then `modal endpoint info`
   prints the URL and model name) and Muse Spark Open on Baseten's Model API
   (per token from the Baseten credits). The variables carry the URL, key
   and model name; no deploy code of our own.
4. **The smoke test runs per backend** and the findings (does each server
   honour `json_schema` output, what changed, latency) go into
   ARCHITECTURE.md.

After this step the whole pipeline can run on an open-weight model by
changing one variable.

## Before you start

- The Meta Model API stays the default. Modal and Baseten each have $100 of
  credits on the user's account.
- Muse Spark Open is 816B parameters (42B active): hosted only, and on
  Modal only as a per-token Shared Endpoint that the credits exclude.
  Baseten's docs say it has no structured output there; the smoke test
  checks it. Muse Glimmer 30B is the model Modal offers as a credited
  Dedicated Endpoint.

## Implementation details

### 1. Environment (`.env.example`, `src/core/env.ts`)

```sh
LLM_BACKEND=meta                 # meta | modal | baseten
MODAL_BASE_URL=                  # `modal endpoint info <name>` URL, plus /v1
MODAL_PROXY_TOKEN=               # wk-<id>.ws-<secret>; not the CLI's API token
MODAL_MODEL=                     # the endpoint's model name
BASETEN_BASE_URL=https://inference.baseten.co/v1   # default
BASETEN_API_KEY=
BASETEN_MODEL=                   # the slug on Baseten's Model APIs page
```

`ConfigSchema` gets the keys as optional strings, `BASETEN_BASE_URL` with a
default, and `LLM_BACKEND` as
`z.enum(['meta','modal','baseten']).default('meta')`; a blank value counts
as unset.

### 2. `src/core/backends.ts`

```ts
export type Backend = { name: 'meta' | 'modal' | 'baseten'; baseURL: string; apiKey: string; model: string; strongModel: string };
export function resolveBackend(config: Config, override?: string): Backend;
```

`meta` → `LLM_BASE_URL`, `MODEL_API_KEY`, `LLM_MODEL`, `LLM_MODEL_STRONG`;
`modal` and `baseten` → their variables; missing variables throw a message
naming them. `createLlm` takes a `backend` (default resolved from config)
and builds its `OpenAI` client from it; the result's `backend` and `model`
fields, the replay key and the `llm:call` event all carry the backend. Cost
comes from `prices.ts` by model name, 0 for a model missing from the table.

### 3. Modal and Baseten: `modal/README.md`

Both are hosted endpoints: the README says how the Modal endpoint is
created and where each key comes from (a Modal proxy token; a Baseten API
key and the model slug) and which variables to set. Muse Spark Open's
per-token price (`$1.25` in, `$0.15` cached, `$4.25` out per 1M) goes into
`prices.ts`; a GPU-time endpoint's model is absent from the table and costs
$0 there, with `durationMs` for estimates.

### 4. CLI and smoke

`pnpm smoke --backend modal|baseten` (parseArgs in `src/smoke.ts`); `weave run
… --backend <name>` sets `ctx.backend` and the llm for the whole run.

### 5. Findings

In ARCHITECTURE.md "Model layer", add a short table: backend, server,
`json_schema` honoured (yes/no/partly), what the bridge had to change,
latency of the smoke call.

## Done when

```sh
pnpm smoke --backend modal    # parsed object, "modal/<model>", $0 (GPU time)
pnpm smoke --backend baseten  # same, with the priced cost
pnpm weave run fixtures/ideas/freelancer-workspace.md --to scope --backend modal
grep '"backend":"modal"' runs/<id>/events.jsonl
pnpm test                     # the Meta path is unchanged
```

## Watch out

- Keep secrets in `.env`; the Modal proxy token and the Baseten key are secrets too.
- The replay key includes the backend, so a Modal run never replays a Meta
  recording.
- Don't add Modal's Python to the TypeScript tooling: `modal/` is a sibling
  folder with its own README.
