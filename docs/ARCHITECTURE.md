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
  └─ scaffold app from template/ ─ apply theme      Phase 6+
        ├─ backend: codegen from contract, agent fills custom operations
        └─ frontend: prototype from screens, agent wires data and builds new components
  └─ tests from frozen flows ─ run ─ triage ─ repair (bounded)
  └─ package (compose) ─ release (git, CI, tag)
```

Phases 2 to 5 are planned in detail in `PLAN.md`. Phase 6 onward is expanded
into tasks when Phase 5 closes, after the user confirms the decisions in
OPTIONS.md sections 6 to 11.

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
5. **Bounded loops.** Drafting gets 3 rounds, each reconciliation loop 2,
   coding repair 2 (D1.6). Blockers left after the last round stop the run
   with a report naming them.
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
    artifacts.ts         envelope, canonical hash, versions, staleness
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
constraint and the expected shape. Only mandatory issues are sent back.

## Stage runner

```ts
async function runSpecStage<T>(o: {
  stage: string;
  schema: z.ZodType<T>;
  system: string; // filled prompt
  user: string; // inputs, serialized
  validate: (output: T) => Issue[];
  maxRounds: number;
  model?: 'default' | 'strong';
}): Promise<{ output: T; warnings: Issue[]; rounds: number }>;
```

Round 1 sends system + user. A round with mandatory issues appends the model's
JSON and a user message listing only those issues, asking for the full
corrected JSON (D1.5 default). After the last round the runner throws a
`StageFailed` error carrying the report; the CLI prints it and exits non-zero.

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

## Meta tooling map

| Where                            | Meta product                                                    |
| -------------------------------- | --------------------------------------------------------------- |
| Scope, flows, design, contracts  | Muse Spark structured output on the Meta Model API              |
| Repairs that failed twice        | Muse Wonder (D1.8)                                              |
| Screenshot review of prototypes  | Muse Spark image understanding (D3.7)                           |
| Moodboard and hero art, optional | Muse Image, $0.01 per image (D3.3 option C)                     |
| Coding stages                    | Muse Code headless or an own tool loop on the Model API (D9.1)  |
