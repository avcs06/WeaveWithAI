# 08 · F8 Open-weight model backends

Phase 1 · 2 h · Depends: F4, F7 · Decisions: D1.11 (A, B, C ticked) · Spec:
ARCHITECTURE.md "Model layer"

## Goal

Run the same pipeline on Meta's open-weight models, through Modal (the run
that counts for the open-weights prize) and locally (a test), by switching
one variable. No stage code knows which backend it runs on.

## What this step does

1. **Three backends, one switch.** `LLM_BACKEND=meta|modal|local` picks
   where calls go; each backend has its own base URL, key and model
   variables. The default stays the Meta Model API.
2. **The model client builds its HTTP client from the chosen backend**; the
   backend's name travels with every event, audit file and replay key, so a
   Modal run never replays a Meta recording and the dashboard can say which
   run used which.
3. **Modal**: a small Python app serves Muse Spark Open with vLLM behind an
   OpenAI-compatible endpoint; deploying it prints the URL, which goes into
   the variables. Paid from the Modal credits; scales to zero when idle. This
   is the run the infrastructure partner verifies for the open-weights prize.
4. **Local**: the same model family on a local server (llama.cpp, or Ollama)
   on this machine, CPU speed, best effort.
5. **The smoke test runs per backend** and the findings (does each server
   honour `json_schema` output, what changed, latency) go into
   ARCHITECTURE.md.

After this step the whole pipeline can run on an open-weight model by
changing one variable.

## Before you start

- The Meta Model API stays the default. Modal has $100 of credits on the
  user's account. This machine shows no GPU in WSL and has 15 GB RAM, so
  local means CPU speed; if it can't run a model usably, say so in
  ARCHITECTURE.md and keep Modal.
- The model names for Muse Spark Open and Muse Glimmer on Hugging Face are
  the user's to fill in; the step leaves them as variables.

## Implementation details

### 1. Environment (`.env.example`, `src/core/env.ts`)

```sh
LLM_BACKEND=meta                 # meta | modal | local
MODAL_BASE_URL=                  # https://<workspace>--vllm-server-serve.modal.run/v1
MODAL_API_KEY=                   # the token the Modal app checks
MODAL_MODEL=                     # the model id vLLM serves
MODAL_MODEL_STRONG=              # optional; defaults to MODAL_MODEL
LOCAL_BASE_URL=http://127.0.0.1:8080/v1
LOCAL_MODEL=                     # as the local server names it
LOCAL_MODEL_STRONG=
```

`ConfigSchema` gets these as optional strings (`LLM_BACKEND` as
`z.enum(['meta','modal','local']).default('meta')`).

### 2. `src/core/backends.ts`

```ts
export type Backend = { name: 'meta' | 'modal' | 'local'; baseURL: string; apiKey: string; model: string; strongModel: string; priced: boolean };
export function resolveBackend(config: Config, override?: string): Backend;
```

`meta` → `LLM_BASE_URL`, `MODEL_API_KEY`, `LLM_MODEL`, `LLM_MODEL_STRONG`,
`priced: true`. `modal` and `local` → their variables, `priced: false`;
missing variables throw a message naming them. `createLlm` takes a `backend`
(default resolved from config) and builds its `OpenAI` client from it; the
result's `backend` and `model` fields, the replay key and the `llm:call`
event all carry the backend. Cost is 0 for unpriced backends; `durationMs`
stays so GPU time can be estimated.

### 3. Modal: `modal/vllm_server.py` and `modal/README.md`

A Modal app from Modal's "OpenAI-compatible LLM inference with vLLM"
example, trimmed to what we need:

- image: `modal.Image.debian_slim(python_version="3.12").pip_install("vllm", "huggingface_hub[hf_transfer]")`;
  a `modal.Volume` for the Hugging Face cache; `HF_TOKEN` as a Modal secret
  if the model is gated.
- `@app.function(gpu="H100", scaledown_window=300, timeout=600, volumes=…)`
  with `@modal.concurrent(max_inputs=16)` and `@modal.web_server(port=8000)`
  that starts `vllm serve $MODEL --port 8000 --api-key $API_KEY
  --guided-decoding-backend xgrammar`.
- `modal deploy modal/vllm_server.py` prints the URL; set `MODAL_BASE_URL` to
  it plus `/v1`, `MODAL_API_KEY` to the key, `MODAL_MODEL` to the model id.
- README: install `modal`, `modal setup`, deploy, cold start (a few minutes
  the first time while weights download), how to stop (`modal app stop`),
  and that an idle app scales to zero after `scaledown_window`.

### 4. Local: `modal/README.md` section "Local"

`llama.cpp` server: `llama-server -m <model.gguf> --port 8080 --jinja -c 16384`;
`LOCAL_BASE_URL=http://127.0.0.1:8080/v1`, `LOCAL_MODEL=<any name>`. llama.cpp
turns `response_format: json_schema` into a grammar, so constrained decoding
works. Ollama is the alternative (`http://127.0.0.1:11434/v1`); confirm its
`json_schema` support with the smoke test before relying on it.

### 5. CLI and smoke

`pnpm smoke --backend modal|local` (parseArgs in `src/smoke.ts`); `weave run
… --backend <name>` sets `ctx.backend` and the llm for the whole run.

### 6. Findings

In ARCHITECTURE.md "Model layer", add a short table: backend, server,
`json_schema` honoured (yes/no/partly), what the bridge had to change,
latency of the smoke call.

## Done when

```sh
pnpm smoke --backend modal    # parsed object, "modal/<model>", $0
pnpm smoke --backend local    # same, or the recorded reason it can't run here
pnpm weave run fixtures/ideas/project-tracker.md --to scope --backend modal
grep '"backend":"modal"' runs/<id>/events.jsonl
pnpm test                     # the Meta path is unchanged
```

## Watch out

- Keep secrets in `.env`; the Modal key is a secret too.
- The replay key includes the backend, so a Modal run never replays a Meta
  recording.
- Don't add Modal's Python to the TypeScript tooling: `modal/` is a sibling
  folder with its own README.
