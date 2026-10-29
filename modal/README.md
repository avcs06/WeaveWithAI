# Open-weight backends

Weave runs the same pipeline on Meta's open-weight models by switching
`LLM_BACKEND` (Decision D1.11): Muse Glimmer 30B on a Modal Dedicated
Endpoint, Muse Spark Open on Baseten's Model API. Both are managed
endpoints, so neither needs a deploy of our own.

## Modal

A Dedicated Endpoint is a model Modal runs for you on a GPU, billed as GPU
time (which the Modal credits cover) and scaled to zero when idle. Modal
offers Muse Glimmer 30B this way; Muse Spark Open only as a per-token
Shared Endpoint that the credits exclude.

1. Sign in once (`pip install modal` or `uv tool install modal`, then
   `modal setup`). Create the endpoint from the dashboard's Endpoints tab
   (model Muse Glimmer 30B BF16) or with
   `modal endpoint create --model meta-models/Muse-Glimmer-30B`. The first
   start downloads the weights and takes several minutes.
2. `modal endpoint info <name>` prints the URL and the model name.
3. Create a proxy token: `modal workspace proxy-tokens create`, joined as
   `wk-<id>.ws-<secret>`. Modal says proxy tokens cannot be interchanged with
   the CLI's API token (`ak-`/`as-`) that `modal setup` stores.
4. In `.env`: `MODAL_BASE_URL=<URL>/v1`, `MODAL_MODEL=<model name>`,
   `MODAL_PROXY_TOKEN=wk-<id>.ws-<secret>`.
5. `pnpm smoke --backend modal`.

The endpoint serves with SGLang and warms up with a `json_schema` request,
so structured output is supported. `modal endpoint stop <name>` removes it.

## Baseten

Muse Spark Open runs on Baseten's Model API.

1. In the dashboard: create an API key.
2. In `.env`: `BASETEN_API_KEY=<key>` and `BASETEN_MODEL=<id>`.
   `BASETEN_BASE_URL` (`https://inference.baseten.co/v1`) is the default.
   `GET https://inference.baseten.co/v1/models` with the key lists the ids;
   a hackathon key is scoped to `meta-models/muse-spark-open-1026` and every
   other id answers 403 "please check the api-key you provided".
3. `pnpm smoke --backend baseten`.

Baseten's docs say Muse Spark Open there has no structured output, but the
smoke test gets `response_format: json_schema` back valid for every
construct, so nothing in the client differs for this backend.

## Smoke test per backend

```sh
pnpm smoke --backend meta
pnpm smoke --backend modal
pnpm smoke --backend baseten
```

Each prints the parsed object and `<backend>/<model>: <tokens>, $<cost>, <ms>`.
A model missing from `src/core/prices.ts` reports $0; that is the case for the
Modal endpoint, which is billed as GPU time.
