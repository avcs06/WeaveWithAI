# Architecture

Models write specifications; code generates, checks and ships. A plain
TypeScript orchestrator runs stages in a fixed order. Stages talk only through
JSON artifacts on disk. Every artifact carries stable IDs and the versions of
the artifacts it was made from.

## Pipeline

```text
idea.md (+ answers.json)
  └─ scope ─ flows-catalog ─ flows-expand (batches) ─ flows (reconcile)   Phase 2   D2.1 E
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
6. **Deterministic where possible.** Contrast checks, the layout skeleton,
   contract code, test scaffolds, Git and packaging are code. A model is used
   only where judgement is needed, the theme's colors included (D3.3 E).
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
    design.ts            screen kinds, section kinds, node roles, states, layout limits
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
    design/              brief, theme, IA and nodes calls, resolve, routing, layout solver: same layout
    contracts/           domain + operations: same layout, plus compile.ts
    reconcile/           matrix.ts, patch.ts, procedure.ts, prompts
    tests/               e2e specs generated from the frozen flows, run, evidence
  app/
    scaffold.ts          template copy, install, MCP build
    theme.ts             02-theme.json written into an app's colors, tokens, fonts and recipes
    preview.ts           an app from the template, and every component screenshotted in its theme
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
  input/answers.json           answers to questions, each with the question as asked (interactive mode or by hand)
  01-scope.json  01-scope.md  artifacts: envelope + data, and the human rendering
  01-flows-catalog.json  01-flows-catalog.md   every flow's header and description, the reusable fields, forms, subflows
  01-flows-draft.json          the expansion batches assembled, before reconciliation
  01-flows.json  01-flows.md   the flows every later stage reads
  02-brief.json  02-theme.json  02-screens.json  02-design.md
  02-skeleton.json  02-wireframes.html  02-ds-gaps.json
  02-theme-light.png  02-theme-dark.png   every component in the theme (weave app)
  03-contract.json  03-contract.md
  04-matrix.json  04-reconcile.md
  spec.lock.json               frozen versions for implementation
  app/                         the generated app (a template copy plus generated code)
  app.ledger.json              every generated file with its origin and step
  benchmark/                   raw tool output; benchmark.json and 05-benchmark.md beside it
  06-e2e.md                    evidence table and repair requests
  reports/<stage>.json         issues per round
  llm/<stage>-r<round>.json    request and response, for audit and replay
  llm/<stage>-r<round>-cut.json  an answer cut at the output limit, as far as it got
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
  compose?: Compose<T>; // how the document is produced: draft(call) and fix(call, current, pending, answers); default one conversation
  start?: Draft<T>; // a document to validate in round 1 instead of generating one (reconciliation)
}): Promise<{ output: T; warnings: Issue[]; known: Issue[]; answers: Answers; model: string; rounds: number }>;
```

The flows stage uses both (D2.1 E): `flows-catalog` runs the default
conversation; `flows-expand` runs one child stage per batch of eight flow ids
in parallel, each with a compose whose draft is one expansion call and whose
fix resends the issues, and assembles the batches into the draft; `flows`
starts from the draft with no reviewer and a compose whose fix asks for a
patch and applies it. Every call a compose makes is logged as an `llm:call`
under its own stage name (`flows-expand-2`, `flows-patch`).

The schedule (D1.12):

| Round | Generator | Then | Reviewers |
| --- | --- | --- | --- |
| 1 | generate | validate | |
| 2 | fix the mandatory issues | validate | 2 calls |
| 3 | fix the mandatory issues and blockers | validate | 1 call |
| 4 | final fix | validate | |

Round 1 sends system + user. A fix appends the model's JSON and one user
message (`src/core/prompt-fix.md`) listing what is pending (mandatory issues
and blockers) and the answers given since the last generation, asking for
the full corrected JSON (D1.5 default); a fix with nothing pending is skipped,
but the round's reviewer calls still run. From round 2 on, validators and
reviewers look at the same output, whatever the validators found: a
heuristic, not a gate. A reviewer gets the generator's system and user messages, its
JSON, the warnings as already known and one of the stage's two guides:
`review-<stage>-peer.md`, a peer who challenges the decisions (round 2 only),
or `review-<stage>-output.md`, which looks for errors in meaning the
validators cannot catch (rounds 2 and 3). It answers through the `Review` schema (`src/core/review.ts`,
blockers only); each blocker becomes a mandatory issue with rule `REVIEW`.
The stage ends as soon as a review finds nothing on validator-clean output,
so a clean first draft costs one generation and two reviews. After round 4
whatever is pending is the stage's known issues: in the report, the
`stage:done` event, `state.json` and the result. The stage never fails on
issues; `weave run` exits 1 only for real errors. With `ask` (interactive
runs, D1.7 C) the runner asks after every round that produced new output;
the answers ride along with the next fix and never force a generation, and
all of them come back in `answers` for the stage to save. An answer keeps
the question as asked, so a rerun that numbers its questions differently
does not mistake an old answer for a new question.

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
  `retry-after-ms` or `Retry-After` up to a minute. A backend with a cold-start
  budget (Modal, 5 minutes) keeps retrying a 503 past the usual 5 attempts.
  `finish_reason: 'length'` is a retryable error with a larger `max_tokens`
  once; the stage round then asks once more (F14), and a second cut is a
  stage failure. Each cut answer is kept in the run as far as it got.
- Logs tokens, cached tokens and cost per call to `events.jsonl`, using the
  prices in docs/README.md; a live call to a model without a price also logs a
  `warning` event, since its cost counts as 0.
- Replay cache: key = sha256(model, messages, schema). With `LLM_REPLAY=true`
  an identical request returns the recorded response without a call. Changing
  a prompt or schema changes the key, so stale replays can't happen. A replay
  file that is not JSON fails the call and names the file to delete.
- Model routing: `default` uses `LLM_MODEL`; `strong` uses `LLM_MODEL_STRONG`
  for a round that failed twice (D1.8). A backend without its own strong
  model sends a strong call to the base model one reasoning level up
  (medium to high, high to xhigh, never max).
- Output budget: `max_tokens` caps reasoning and visible output together on
  Meta's models, and reasoning is billed as output. Stages pass their own
  budget, reasoning level and first-draft temperature (D1.13); fixes run at
  0.2, reviewer calls at `reasoning_effort: medium` and 0.2.
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
the template's own TypeScript tooling and folder). The inventory keeps what
the design stage needs per component: name, category, one-line description,
variant values, the recipe's default variants, every look its `look` prop
accepts (`src/ds/looks.ts`, read from the recipes files), the fixed box
dimensions, padding and gap by size and part
(`template/tools/measure-design-system.mjs`, measured in a browser from the
`Measure` story on Storybook; padding is the inset to the content, summed
down wrappers that hold one child), what it shows
and the pseudo entries the exporter cannot see, like Toast
(`src/ds/curated.json`, hand-written), and the components that go inside it
(`src/ds/compose.ts`, from the recipes' JSX). Plus all tokens and the settings
a project decides once (`src/ds/project.ts`: theme and page colors, focus
ring, radius, fonts). Components of the placeholder web app, config
components that render nothing and internals never placed by a design are
left out. Loading takes about 7 seconds and the measurement needs Storybook
on 6006, so the result is cached in `.weave-cache/inventory-<hash>.json`,
keyed by a hash of the files under `template/packages/*/src`, `tokens.ts`,
`colors.ts` and `designsystem.config.json`.

Prompts receive the inventory as prose (`src/ds/prose.ts`): one block per
component with its facts on short lines, subcomponents indented under the
one they belong to, about 12 KB for 40 components. Validators receive the
full inventory.

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
