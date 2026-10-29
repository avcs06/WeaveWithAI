# Architecture

Models write specifications; code generates, checks and ships. A plain
TypeScript orchestrator runs stages in a fixed order. Stages talk only through
JSON artifacts on disk. Every artifact carries stable IDs and the versions of
the artifacts it was made from.

## Pipeline

```text
idea.md (+ answers.json)
  └─ scope ─ flows                                  Phase 2   specs/flows.md
        ├─ design: brief ─ theme ─ screens          Phase 3   specs/design.md
        └─ contracts                                Phase 4   specs/contracts.md
              (design and contracts run in parallel from the same flows version)
  └─ reconcile ─ freeze (spec.lock.json)            Phase 5   specs/reconciliation.md
  └─ scaffold app from template/ ─ apply theme      Phase 6   steps 36, 37
        └─ codegen from the contract: types, client, hooks, seed, mock API, API tests
  └─ frontend: page shells (code) ─ new components ─ pages (model sessions)   Phase 7
  └─ benchmark: build, serve, Lighthouse, axe, screen reader, keyboard, code  Phase 8
  └─ tests from frozen flows ─ run ─ evidence ─ repair (bounded) ─ benchmark again   Phase 9
```

Every phase is planned as tasks in `PLAN.md`, with one step file per task in
`docs/steps/`. Pivot 2026-10-28: no backend and no deployment this week. The
contract becomes a mock API inside the generated app (OPTIONS.md 6M) and a
benchmark stage (section 13) reports the frontend's quality in one table.

## Principles

1. **Artifacts, not conversations.** A stage reads files from the run folder and
   writes files. No stage sees another stage's chat.
2. **Stable IDs everywhere.** Flows `F03`, steps `F03.S02`, alternatives
   `F03.A01`, screens `S04`, sections `S04.sec2`, nodes `S04.n07`, entities
   `Project`, operations `createProject`. Reconciliation, test generation and
   repair requests all point at IDs.
3. **Versioned inputs.** Every artifact records the version and hash of each
   input. When an input changes, everything downstream is stale and reruns.
4. **Mandatory versus warning.** A stage is done when it has zero mandatory
   issues, not when it is perfect. Warnings are reported, never looped on.
5. **Bounded loops.** Spec stages run a fixed four-round schedule with
   model review on rounds 2 and 3 (D1.12); each reconciliation loop gets 2
   rounds, coding repair 2 (D1.6). Issues left after the last round are
   recorded as known issues in the report and the run state; the run goes on.
6. **Deterministic where possible.** Theme palettes, contract code, test
   scaffolds, Git and packaging are code. A model is used only where judgement
   is needed.
7. **Ownership.** Each stage may change only its own artifacts and folders.
   Implementation stages can never edit acceptance tests or thresholds (R2).
8. **Resumable.** `--from <stage>` reruns from a checkpoint; recorded model
   responses replay for free while you iterate on validators (D1.9).

## Code layout

```text
src/
  tsconfig.json          the agent's TypeScript config (never at the repo root)
  cli.ts                 weave run | validate | show | ds
  smoke.ts               one real structured call, for setup checks
  config/
    capabilities.ts      supported and unsupported MVP capabilities
    fonts.ts             font allowlist for themes
    design.ts            layout templates, section kinds, element allowlist
  core/
    llm.ts               the only model client: structured output, retries,
                         usage and cost, replay cache, model routing
    schema.ts            zod to JSON Schema, plus checks for Meta's limits
    artifacts.ts         envelope, versions, staleness
    utils.ts             canonical JSON and hashing, atomic JSON writes, paths beside a module
    run.ts               run folder, state.json, events.jsonl
    issues.ts            Issue type, report writing, mandatory/warning split
    runSpecStage.ts      generate, validate, feed back mandatory issues, repeat
    prompt.ts            loads prompt .md files and fills {{placeholders}}
  ds/
    inventory.ts         design-system inventory from the template, cached
  stages/
    flows/               scope + flows: schema, prompts, validate, render, stage
    design/              brief, theme (code), screens: same layout
    contracts/           domain + operations: same layout, plus compile.ts
    reconcile/           matrix.ts, patch.ts, procedure.ts, prompts
    tests/               e2e specs generated from the frozen flows, run, evidence
  app/
    scaffold.ts          template copy, install, MCP build
    theme.ts             02-theme.json applied with ts-morph (THEME-003)
  codegen/
    ledger.ts            every file written into an app, with its origin
    entities.ts          web/app/entities/<entity>: schemas, client, hooks
    mockApi.ts           web/app/api/**/route.ts, web/mocks/*.json, store, session
    apiTests.ts          contract tests against the mock
    pages.ts             routes, navigation and page shells from 02-screens.json
  engine/
    loop.ts              the action loop: read, write, list, recipe, check, done
    tools.ts             the checks a session may run, through the app's tools
  checks/                rendered checks (DESIGN-R-*), reusable collectors
  bench/                 server, lighthouse, accessibility, screenReader,
                         keyboard, code, report
  dashboard/             one static HTML per run
fixtures/
  ideas/                 reference idea briefs
  golden/<idea>/         accepted artifacts, so later stages develop offline
runs/<runId>/            one generator run (gitignored)
```

## Run folder

```text
runs/<runId>/
  input/idea.md
  input/answers.json           answers to questions (interactive mode or by hand)
  01-scope.json                artifacts: envelope + data
  01-flows.json  01-flows.md   JSON and its human rendering
  02-brief.json  02-theme.json  02-screens.json  02-design.md
  03-contract.json  03-contract.md
  04-matrix.json  04-reconcile.md
  spec.lock.json               frozen versions for implementation
  app/                         the generated app (a template copy plus generated code)
  app.ledger.json              every generated file with its origin and step
  benchmark/                   raw tool output; benchmark.json and 05-benchmark.md beside it
  06-e2e.md                    evidence table and repair requests
  reports/<stage>.json         issues per round
  llm/<stage>-r<round>.json    request and response, for audit and replay
  events.jsonl                 one line per stage start, round, issue count, tokens, cost
  state.json                   stage status and artifact versions
```

## Artifact envelope

```ts
type ArtifactName = 'scope' | 'flows' | 'brief' | 'theme' | 'screens' | 'contract' | 'matrix';

type Envelope<T> = {
  meta: {
    artifact: ArtifactName;
    version: number; // +1 on every write
    hash: string; // sha256 of canonical JSON (sorted keys) of `data`
    inputs: Partial<Record<ArtifactName, { version: number; hash: string }>>;
    stage: string;
    model: string | null; // null for code-made artifacts
    rounds: number;
    createdAt: string;
  };
  data: T;
};
```

An artifact is **stale** when any `inputs[name].hash` differs from the current
hash of that artifact. `weave run` reruns stale stages in pipeline order.

## Issues

```ts
type Issue = {
  rule: string; // 'FLOW-011'
  severity: 'mandatory' | 'warning';
  message: string; // says what is wrong and what would fix it
  at?: string; // an ID ('F03.S02') or a JSON path
  owner?: 'flows' | 'design' | 'contract'; // used by reconciliation routing
};
```

Messages are written for the model that will fix them: name the ID, the
constraint and the expected shape. Only mandatory issues are sent back;
reviewer blockers are mandatory issues with rule `REVIEW`.

## Stage runner

```ts
async function runSpecStage<T>(o: {
  stage: string;
  schema: z.ZodType<T>;
  system: string; // filled prompt
  user: string; // inputs, serialized
  validate: (output: T) => Issue[];
  review?: string; // the stage's review guide; without it, no reviewer calls
  ask?: (output: T) => Promise<Answers>; // interactive stages: blocking questions, after each new output
}): Promise<{ output: T; warnings: Issue[]; known: Issue[]; answers: Answers; rounds: number }>;
```

The schedule (D1.12):

| Round | Generator | Then | Reviewers |
| --- | --- | --- | --- |
| 1 | generate | validate | |
| 2 | fix the mandatory issues | validate | 2 calls |
| 3 | fix the mandatory issues and blockers | validate | 1 call |
| 4 | final fix | validate | |

Round 1 sends system + user. A fix appends the model's JSON and a user
message listing what is pending (mandatory issues and blockers), asking for
the full corrected JSON (D1.5 default); a fix with nothing pending is skipped,
but the round's reviewer calls still run. A reviewer gets the generator's
system and user messages, its JSON, the warnings as already known and the
stage's `review-<stage>.md` guide, and answers through the `Review` schema
(`src/core/review.ts`, blockers only); each blocker becomes a mandatory
issue with rule `REVIEW`. The stage ends as soon as a review finds nothing on
validator-clean output, so a clean first draft costs one generation and two
reviews. After round 4 whatever is pending is the stage's known issues: in
the report, the `stage:done` event, `state.json` and the result. The stage
never fails on issues; `weave run` exits 1 only for real errors. With `ask`
(interactive runs, D1.7 C) the runner asks after every round that produced
new output; the answers ride along with the next fix in their own message
and never force a generation, and all of them come back in `answers` for the
stage to save.

## Model layer (`src/core/llm.ts`)

- `openai` SDK with `baseURL` from `LLM_BASE_URL`, key from `MODEL_API_KEY` (D1.3).
- Structured output through `response_format: { type: 'json_schema', json_schema: { name, schema } }` (D1.4).
- `schema.ts` converts zod to JSON Schema and enforces Meta's limits before
  sending: no recursion, nesting depth at most 10, rewrites `oneOf` to `anyOf`,
  drops `$schema`. A test walks every stage schema through it. (Checked: zod
  4.6's `z.toJSONSchema` emits `oneOf` for discriminated unions, plus
  `$schema` and `additionalProperties: false`. Meta rejects `oneOf` only in
  strict mode, which is off by default, but `anyOf` is safe in both.)
- Every schema in the specs was compiled with zod 4.6 on 2026-10-28: the
  deepest (flows, and the flows patch) nests 8 levels, the largest (the
  contract) has 128 properties, none has a `$ref`, and only the node `ref`
  union produces `oneOf`.
- Retries 429 and 5xx with exponential backoff and jitter, honouring
  `Retry-After`. `finish_reason: 'length'` is a retryable error with a larger
  `max_tokens` once, then a stage failure.
- Logs tokens, cached tokens and cost per call to `events.jsonl`, using the
  prices in docs/README.md.
- Replay cache: key = sha256(model, messages, schema). With `LLM_REPLAY=true`
  an identical request returns the recorded response without a call. Changing
  a prompt or schema changes the key, so stale replays can't happen.
- Model routing: `default` uses `LLM_MODEL`; `strong` uses `LLM_MODEL_STRONG`
  for a round that failed twice (D1.8).
- Backends (D1.11): `LLM_BACKEND` picks the Meta Model API (default), a
  Modal Dedicated Endpoint serving Muse Glimmer, or Baseten's Model API
  serving Muse Spark Open. Same client, same schema bridge; the backend and model are
  logged per call and are part of the replay key. F8 records how each server
  handles `json_schema` output.

### Backend findings

From `pnpm smoke --backend <name>` with the step F4 toy schema: nested arrays,
an enum, a nullable number, a discriminated union.

| Backend | Server | `json_schema` honoured | Bridge changes | Smoke call |
| --- | --- | --- | --- | --- |
| meta | Meta Model API, `muse-spark-1.3` | yes, every construct (2026-10-29) | none | 5.7 s; 253 tokens in, 914 out for a 492-character answer, so the billed output includes hidden reasoning tokens and output cost dominates |
| modal | Modal Dedicated Endpoint, `meta-models/Muse-Glimmer-30B` on SGLang, one H200 | yes, every construct (2026-10-29) | none | 38 s for 573 output tokens once warm; the cold start answered 503 for about 4 minutes, longer than the client's 5 retries; two warm calls were cut at the 16384-token cap before one completed, so Glimmer's reasoning can run away; billed as GPU time, so $0 in the cost column |
| baseten | Baseten Model API, `meta-models/muse-spark-open-1026` | yes, every construct (2026-10-29), although Baseten's docs say Spark Open there has none | none | 5.0 s; 164 tokens in, 1267 out, $0.0056; the hackathon key is scoped to the `-1026` id and gets 403 on every other model, including plain `muse-spark-open` |

## Design-system inventory (`src/ds/inventory.ts`)

The design system is read from `template/` by
`template/tools/export-design-system.mjs`, run as a child process (it needs
the template's own TypeScript tooling and folder). It prints components with
props, variant values, descriptions, superseded alternatives and recipe names,
plus all tokens. Loading takes about 7 seconds, so the result is cached in
`.weave-cache/inventory-<hash>.json`, keyed by a hash of the files under
`template/packages/**/src` and `template/tokens.ts` and `template/colors.ts`.

Prompts receive a slim summary (name, one-line description, variant values,
about 4 KB for 43 components). Validators receive the full inventory.

## Generated app

A run's app is a copy of `template/` plus generated code. Everything the
generator writes is recorded in `app.ledger.json` with its origin.

```text
runs/<runId>/app/
  colors.ts  tokens.ts  packages/styles/src/fonts.ts     themed by code (S1)
  web/mocks/seed.json  web/mocks/db.json                  seed rows and the live store (S3)
  web/app/api/_mock/{store,http,session}.ts               store queue, envelope, cookie session (S3)
  web/app/api/<kebab-plural>/route.ts                     list, create (S3)
  web/app/api/<kebab-plural>/[id]/route.ts                get, update, delete (S3)
  web/app/api/<kebab-plural>/[id]/<kebab-verb>/route.ts   actions (S3)
  web/app/api/auth/{sign-up,sign-in,sign-out,me}/route.ts (S3)
  web/app/api/__tests__/<entity>.test.ts                  contract tests (S4)
  web/app/entities/<entity>/{schema,api,hooks,index}.ts   compiled contract (S2)
  web/app/entities/auth/{api,hooks,index}.ts              session (S2)
  web/app/components/<Name>/                              new components (FE3, model)
  web/app/components/PageHeader.tsx                       navigation from the IA (FE2)
  web/app/(routes)/<route>/page.tsx                       shell by code (FE2), filled by the model (FE4)
  web/app/(routes)/<route>/<Dialog>.tsx                   dialogs and drawers of that page
  web/e2e/<flow>.spec.ts  playwright.config.ts            tests from the frozen flows (T1)
```

Imports keep the template's direction: shared → entities → components →
blocks → (routes). Route folders never import each other.

## Meta tooling map

| Where                            | Meta product                                                    |
| -------------------------------- | --------------------------------------------------------------- |
| Scope, flows, design, contracts  | Muse Spark structured output on the Meta Model API              |
| Repairs that failed twice        | Muse Wonder (D1.8)                                              |
| Screenshot review of prototypes  | Muse Spark image understanding (D3.7)                           |
| Moodboard and hero art, optional | Muse Image, $0.01 per image (D3.3 option C)                     |
| Coding stages                    | An action loop on the Model API (D9.1 B); the same loop on Muse Spark Open through Modal (D1.11) |
| Assertions in generated tests    | Muse Spark structured output turns flow outcomes into assertions (D8.2 A) |
