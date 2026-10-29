# Plan

Start: Wed 2026-10-28, 15:30 IST. Submit by Wed 2026-11-04 evening IST (the
portal closes Thu 2026-11-05, 07:30 IST). About 8 to 10 hours a day.

**Pivot, 2026-10-28 evening.** The backend and deployment agents are parked.
Everything after the frozen spec goes into the frontend: the contract becomes
mock data and a mock API inside the generated app (a create adds a row to a
JSON file), the frontend is built on top of that, and a benchmark stage runs
right after generation and reports every frontend quality number in one
table: duplicate implementations, performance, accessibility, screen reader,
keyboard navigation and code quality. Tests and bounded repairs follow. The
original backend, packaging and deployment work stays in OPTIONS.md sections 6,
10 and 11, marked parked, for after the hackathon.

**How to use this file.** Every task has a step file in `docs/steps/`
(`NN-<id>-<slug>.md`, numbered in execution order; the index is
[steps/README.md](steps/README.md)). The step file says how to build the task:
files, signatures, libraries, commands, tests, and the checks that prove it.
The loop for each task:

1. You read the next step file, change what you want, and say go.
2. The agent implements exactly what the step file says, runs its **Done
   when**, ticks the task here (`- [x] … (done YYYY-MM-DD)`) and leaves every
   change unstaged.
3. You review, stage and commit (`<task id>: <summary>`).

Blocked: the agent adds `> Blocked: <reason>` under the task and stops for
you. Work discovered on the way becomes a new unticked task with one line
saying why, never extra work in the current step.

## Milestones

| Gate | When          | Done when                                                                                       |
| ---- | ------------- | ----------------------------------------------------------------------------------------------- |
| G0   | Oct 28, 16:30 | Repo restructured; template checks pass from `template/` (done)                                 |
| G1   | Oct 29, 01:30 | Freelancer workspace and dashboard editor produce scope and flows with zero mandatory issues; ecommerce store (unseen) run once untuned and recorded, then passes too; golden fixtures saved |
| G2   | Oct 29, night | Every golden idea produces brief, theme and screens with zero mandatory issues; gap report works |
| G3   | Oct 30, 13:00 | Every golden idea produces a contract, in parallel with design; seeds validate                 |
| G4   | Oct 30, night | Every golden spec set frozen; seeded defects found and fixed within limits                     |
| G5   | Oct 31        | Freelancer workspace scaffolded and themed from the frozen spec; typed client, hooks and mock API generated from the contract; contract tests pass against the mock; the app builds |
| G6   | Nov 1         | Freelancer workspace works end to end by hand on the mock API: pages from the screens, new components built, hooks wired, rendered checks pass |
| G7   | Nov 2         | Benchmark table generated for the freelancer workspace; e2e tests generated from the frozen flows pass after bounded repairs |
| G8   | Nov 3         | Two ideas generated end to end without manual edits (or every edit logged); both benchmarked; one run on Muse Spark Open through Modal; run dashboard works |
| G9   | Nov 4         | Demo video recorded, README has real numbers and separates hackathon work from the design system, submitted |

---

## Phase 0: Restructure the repository (Oct 28, 15:30 to 16:30)

Done on 2026-10-28 on branch `hackathonv2`. Decisions: D0.1 to D0.4.

- [x] **M1** Commit the finished design-system components (done 2026-10-28)
  - `hackathon` holds the finished design system and stays as it is.

- [x] **M2** Restructure the repository (done 2026-10-28). Depends: M1
  - Everything moved into `template/`, the MCP into `mcps/frontend/`
    with `template/tools/weave-design-system-mcp` linking back to it, and the
    agent kit landed at the root. Agent and MCP client configs that only served
    the template were removed.

- [x] **M3** Verify the template from its new folder (done 2026-10-28). Depends: M2
  - From `template/`: install, typecheck, lint, `nx test ui`, the generator
    tests, `pnpm mcp:check`, `export-design-system.mjs` and a generate run
    all pass.

- [x] **M4** Merge into `hackathon` (dropped 2026-10-28). Depends: M3
  - Branches stay separate: `hackathon` (design system), `hackathonv2`
    (restructure), `hackathonv3` (agent work; everything from here on).

- [x] **M5** Read the official rules and submission form (15 min) (done 2026-10-28)
  - You: the dates and judging weights in `docs/README.md` come from a press
    summary of the official page. Check the official rules and the submission
    form for anything that changes what to build: demo length, repository
    visibility, required write-up, track and theme.
  - Done when: `docs/README.md` "Facts" says what you confirmed, with the link.

## Phase 1: Agent foundation (Oct 28, evening)

Spec: [ARCHITECTURE.md](ARCHITECTURE.md). Decisions: D1.1 to D1.9, D1.11.
Steps 01 to 08.

- [x] **F1** Root package and tooling (20 min) (done 2026-10-28). Depends: M3
  - `pnpm add openai zod execa p-limit` and
    `pnpm add -D typescript@~5.9 tsx vitest @types/node@^22`. TypeScript 5.9
    matches the template and the MCP; `@types/node` 22 matches the lowest
    supported Node. (A trial install picked TypeScript 7.0 by default, which
    also typechecked; pinning keeps one compiler across the repo.)
  - `cp .env.example .env` and set `MODEL_API_KEY`.
  - `src/core/env.ts`: loads `.env` with `process.loadEnvFile()` when the file
    exists, validates the variables in `.env.example` with zod, exports a typed config.
  - Done when: `pnpm typecheck` passes and `pnpm test` runs `src/core/env.test.ts`.

- [x] **F2** Schema bridge (30 min) (done 2026-10-28). Depends: F1
  - `src/core/schema.ts`: `toJsonSchema(schema, name)` wraps `z.toJSONSchema`,
    drops `$schema`, rewrites `oneOf` to `anyOf`, throws on recursive `$ref`s or
    nesting deeper than 10, and returns property and enum counts.
  - Done when: tests cover a nested schema passing, a recursive one throwing, a
    depth-11 one throwing, and a discriminated union coming out as `anyOf`.

- [x] **F3** Model client (60 min) (done 2026-10-28). Depends: F2
  - `src/core/llm.ts`, as in ARCHITECTURE "Model layer":
    `generateStructured({ stage, round, schema, schemaName, messages, model })`
    returns `{ data, raw, usage, costUsd, replayed }`.
  - The OpenAI client is injectable so tests pass a fake.
  - Done when: tests (no network) cover success; 429 then success honouring
    `Retry-After`; `finish_reason: 'length'` retried once with more tokens, then
    an error; replay hit and miss; cost from usage.

- [x] **F4** Smoke test (15 min) (done 2026-10-29). Depends: F3
  - `src/smoke.ts`: a toy schema with nested arrays, an enum, a nullable number
    and a discriminated union, sent to the real API.
  - Done when: `pnpm smoke` prints the parsed object, tokens and cost. If the
    schema bridge needed changes for the API to accept it, note them in
    ARCHITECTURE.md under "Model layer".

- [x] **F5** Runs, artifacts, events, issues (40 min) (done 2026-10-29). Depends: F1
  - `src/core/run.ts`, `artifacts.ts`, `issues.ts`: run IDs like
    `20261028-2010-freelancer-workspace`; envelope with canonical hash, version and
    inputs; `isStale`; `appendEvent`; `writeReport`; `state.json`.
  - Done when: tests cover hash independence from key order, version
    increments, staleness after an input changes, and the mandatory/warning split.

- [x] **F6** Stage runner and prompt loader (30 min) (done 2026-10-29). Depends: F3, F5
  - `src/core/runSpecStage.ts` as in ARCHITECTURE "Stage runner" (D1.5 A, D1.6
    A, D1.8 B); `src/core/prompt.ts` loads a `.md` file and fills
    `{{placeholders}}`, throwing on any it can't fill. It strips HTML comments
    first (prompt files and idea files keep notes for us in them).
  - Done when: tests with a fake model show issues in round 1 fixed in round 2;
    persistent issues end in `StageFailed` with the report after 3 rounds;
    round 3 uses the `strong` model.

- [x] **F7** CLI (30 min) (done 2026-10-29). Depends: F6
  - `src/cli.ts` with `node:util` `parseArgs`:
    `run <idea.md> [--run <id>] [--from <stage>] [--to <stage>] [--interactive] [--no-replay] [--backend <name>]`,
    `validate <runId> [stage]` (validators only, no model calls), `show <runId>`,
    `ds` (filled in by DS1), `bench <runId>` (filled in by B7).
  - Done when: `pnpm weave run fixtures/ideas/freelancer-workspace.md --to scope`
    creates a run folder (with a stub stage until FL5) and `pnpm weave show
    <id>` prints its stage table and token totals.

- [ ] **F8** Open-weight model backends (2 h). Depends: F4, F7. Decision D1.11.
  > Blocked: both smoke tests pass (modal: Glimmer on a Dedicated Endpoint; baseten: Spark Open) and `weave run --backend modal` completes, but the events grep in the Done-when cannot pass until FL5 replaces the stub scope stage, which makes no model call and writes no events. Tick after FL5, or decide the unit tests cover it.
  - Added 2026-10-28: the user wants runs on Modal as well as on the Model
    API, so Weave qualifies for the open-weights prize. Changed 2026-10-29: the
    local backend (D1.11 C) is removed; "local" meant the generator on this
    machine calling the Model API, not a model on own hardware. Also
    2026-10-29: Modal became a Modal-managed Dedicated Endpoint for Muse
    Glimmer (credits cover GPU time, not Shared Endpoints), so the
    self-deployed vLLM app was removed; Baseten added for Spark Open (D1.11 D).
  - `LLM_BACKEND=meta|modal|baseten` (default `meta`) selects the base URL,
    key and model from `MODAL_BASE_URL`, `MODAL_PROXY_TOKEN`, `MODAL_MODEL`,
    `BASETEN_API_KEY`, `BASETEN_MODEL` (in `.env.example` and `env.ts`). The
    backend and model go into every event and into the replay key.
  - Modal: Muse Glimmer 30B on a Dedicated Endpoint, GPU time from the Modal
    credits. Baseten: Muse Spark Open on the Model API, per token from the
    Baseten credits.
  - `pnpm smoke --backend <name>` runs the F4 toy schema. Record in
    ARCHITECTURE "Model layer" how each server handles `json_schema` output and
    what the schema bridge had to change.
  - Done when: `pnpm smoke --backend modal` and `pnpm smoke --backend
    baseten` print a parsed object; `pnpm weave run
    fixtures/ideas/freelancer-workspace.md --to scope --backend modal`
    completes; `events.jsonl` names the backend and model per call; the Meta
    API run is unchanged and its tests still pass.

- [ ] **F9** Model client follow-ups (30 min). Depends: F3, F6
  - Found while building F2 and F3; each is a small decision that doesn't
    block Phase 1, so they're parked here instead of being done in those steps.
  - Log a `warning` event when a model has no entry in `PRICES` (`costUsd`
    returns 0 silently); cap an honoured `Retry-After` and read
    `retry-after-ms` too; treat a corrupt replay file as a miss or fail
    loudly; add an `enums` cap to `assertWithinLimits`.
  - Added 2026-10-29 (F8): a scale-to-zero Modal endpoint answers 503 "no
    upstreams available" for minutes while it cold-starts, and the client
    gives up after 5 attempts (about 20 s). Give 503 on the `modal` backend a
    longer budget, or warm the endpoint before a run. Also: two of three warm
    smoke calls to Glimmer were cut at the 16384-token cap because reasoning
    counts against `max_tokens`; consider a reasoning budget for that backend.

- [x] **F11** Questions inside the stage loop (30 min) (done 2026-10-29). Depends: F10. Decision D1.7 C
  - Added 2026-10-29 by the user: answer the draft's questions while the
    stage runs instead of after it. `runSpecStage` takes `ask?`; after every
    round that produced new output it asks, the answers ride along with the
    next fix (`prompt-answers.md`) and never force a generation, and the
    result carries `answers` for the stage to save. FL5 wires the terminal.
  - Done when: `runSpecStage.test.ts` covers asking per generation, answers
    in the fix message, and answers carried forward; `pnpm typecheck`.

- [x] **BK1** Book keeping: one `src/core/utils.ts` for the shared helpers (20 min) (done 2026-10-29). Depends: F8, FL3
  - Added 2026-10-29 by the user: `canonicalJson` and `sortKeys` are defined
    in both `artifacts.ts` and `llm.ts`, `hashOf` and `sha256` do the same
    job, `writeJson` (llm.ts) overlaps `writeJsonAtomic` (run.ts), and
    `keysOf` is defined twice. Move each into one module and import it. Also
    `prettier --write src` once with the root `.prettierrc` (added
    2026-10-29), so editor saves stop rewrapping files. One commit named
    "book keeping", after the F4 to FL3 and F10 commits.

- [x] **F10** Reviewer agents in the stage runner (60 min) (done 2026-10-29). Depends: F6. Decision D1.12
  - Added 2026-10-29 by the user: validators alone miss problems a reader
    sees at once, so the loop becomes a fixed schedule with model review.
  - `runSpecStage` runs four rounds: generate and validate; fix and validate,
    then two reviewer calls; fix (issues and blockers) and validate, then one
    reviewer call; a final fix and validate. A fix with nothing to fix is
    skipped but the round's reviewers still run; the stage ends as soon as a
    review finds nothing on validator-clean output, so a clean first draft
    costs one generation and two reviews. It never throws for issues: what remains is recorded as known
    issues in the report, the `stage:done` event and `state.json`, the
    artifact is written, and the run continues. `weave show` prints the count.
  - Reviewers get the generator's full prompt, its JSON, the warnings as
    known, and the stage's guide, through one shared review schema
    (`src/core/review.ts`) listing major blockers only; blockers are mandatory
    issues with rule `REVIEW` for the next fix.
  - Prompts in `src/core/prompt-review.md` (reviewer rules, the ignore list)
    and `prompt-review-input.md`; each stage adds a `review-<stage>.md` guide.
  - Done when: `runSpecStage.test.ts` covers the schedule (calls per round,
    skipped fixes, early end, known issues after round 4, no reviewers without
    a guide); `pnpm test`; `pnpm typecheck`.

## Phase 2: Scope and flows (Oct 28, night to Oct 29, 01:30)

Spec: [specs/flows.md](specs/flows.md). Decisions: D2.1 to D2.7. Steps 09 to 14.

- [x] **FL1** Capabilities and schemas (40 min) (done 2026-10-29). Depends: F2
  - `src/config/capabilities.ts` and `src/stages/flows/schema.ts`, as in the spec.
  - Done when: a test passes both schemas through `toJsonSchema`; `pnpm typecheck`.

- [x] **FL2** Validators with tests (90 min) (done 2026-10-29). Depends: FL1
  - Every SCOPE and FLOW rule in `src/stages/flows/validate.ts`.
  - Fixtures in `src/stages/flows/__fixtures__/`: a small hand-written valid
    scope and flows for a reading-list app (5 flows; deliberately not one of the
    reference ideas, because its flow becomes the prompt's format example), and
    one mutation per rule.
  - Done when: each rule has a passing and a failing test; `pnpm test` is green.

- [x] **FL3** Prompts (30 min) (done 2026-10-29). Depends: FL1
  - Review and finish `src/stages/flows/prompt-scope.md` and `prompt-flows.md`
    (drafts provided). Placeholders: capabilities, scope, answers, example flow
    (from the valid fixture).
  - Done when: a test fills both prompts with no missing placeholders.

- [x] **FL7** Capability modes: build, simulate, skip (60 min) (done 2026-10-29). Depends: FL3. Decision D2.5 C
  - Added 2026-10-29 by the user: no whitelist; simulated capabilities get
    their UI with a placeholder effect; skipped ones stay out of scope.
  - `capabilities.ts` carries `mode` and the placeholder text; the scope and
    flows prompts list build, simulated and skipped; SCOPE-004 requires an
    out-of-scope entry only for needed skipped capabilities; FLOW-022 allows
    simulated mentions once the scope needs the capability and flags skipped
    ones. multiTenant, realtime and maps stay skipped to save credits.
  - Done when: `pnpm test` (prompt, schema and validator tests updated);
    `pnpm typecheck`.

- [x] **FL4** Renderer (30 min) (done 2026-10-29). Depends: FL1
  - `src/stages/flows/render.ts`: `01-scope.md` (short) and `01-flows.md` in the spec's format.
  - Done when: a snapshot test renders the valid fixture.

- [x] **FL8** Product-manager standard shared by the scope and flows prompts (60 min) (done 2026-10-29). Depends: FL7, F11
  - Added 2026-10-29 by the user: the two prompts and the two review guides
    carried four drifting copies of what a product manager checks.
  - `src/stages/flows/product-manager.md`: the MVP decisions and the measures
    a reviewer counts, filled into both prompts and both guides through
    `{{productManager}}`; keeping users, growth and operations stay out.
  - Prompts reordered (answers first, capabilities in their own section, flow
    rules grouped); the landing page and roles that never sign in are
    modelled; the capability list no longer reads as a whitelist; `blocking`
    narrowed to a risky default (schema description, D1.7 note).
  - Answers keep the question text (`input/answers.json`, "Answers already
    given", the fix message); `prompt-fix.md` replaces `prompt-fixup.md` and
    `prompt-answers.md`.
  - Done when: `pnpm test`; `pnpm typecheck`.

- [ ] **FL5** Wire the stage (30 min). Depends: FL2, FL3, FL4, F7, F10
  > Blocked: code and tests done 2026-10-29 (stage.ts, review guides, terminal questions, stages registered, stub removed); the live run on freelancer-workspace waits until the user has fixed the idea files.
  - `src/stages/flows/stage.ts`: scope, then flows. With `--interactive`
    each stage passes `ask` to the runner (F11): the blocking, unanswered
    questions are asked on the terminal with their defaults after each new
    draft, and every answer is saved to `input/answers.json`. Register in
    the CLI.
  - Added 2026-10-29 (F10): `review-scope.md` and `review-flows.md`, the
    review guides each stage passes to the runner.
  - Done when: `pnpm weave run fixtures/ideas/freelancer-workspace.md --to flows`
    ends with zero mandatory issues or a readable `StageFailed` report.

- [ ] **FL6** Reference ideas (60 min). Depends: FL5
  - Tune on the freelancer workspace and the dashboard editor: change
    prompts, never validators, until each passes within 3 rounds. Read every
    `01-flows.md` and fix the prompt for anything you'd reject.
  - Then run the ecommerce store once, untuned: it's the unseen test. Record
    what happened, even if it fails. After that it joins tuning until it
    passes too; it is the second end-to-end idea (G8).
  - Save accepted artifacts to `fixtures/golden/<idea>/01-scope.json` and
    `01-flows.json`; record rounds, tokens and cost per idea in
    `fixtures/golden/README.md`.
  - Done when: **G1**.

## Phase 3: Design (Thu Oct 29)

Spec: [specs/design.md](specs/design.md). Decisions: D3.1 to D3.11. Steps 15 to 23.

- [ ] **DS1** Design-system inventory (45 min). Depends: F1
  - `src/ds/inventory.ts`: runs `node template/tools/export-design-system.mjs`
    with execa; caches in `.weave-cache/inventory-<hash>.json`, keyed by a hash
    of `template/packages/*/src/**`, `template/tokens.ts`, `template/colors.ts`;
    exports `inventory()`, `inventorySummary()`, `spacingKeys()`, `radiusKeys()`.
  - Copy one real export to `src/ds/__fixtures__/inventory.json` for tests.
  - `pnpm weave ds` prints counts and the summary's size.
  - Done when: a cached call returns in under 200 ms; the summary of the
    fixture is under 6 KB and lists every component with its variant values.

- [ ] **DS2** Design config (20 min). Depends: F1
  - `src/config/design.ts`: templates, section kinds, element tags, the
    superseded-tag fallback map, the new-component budget.
    `src/config/fonts.ts`: font allowlists with weights.
  - Done when: `pnpm typecheck`.

- [ ] **DS3** Brief (60 min). Depends: DS1, DS2, FL6
  - Brief schema, `prompt-brief.md`, BRIEF rules with tests.
  - Done when: golden freelancer workspace produces a brief with zero mandatory issues.

- [ ] **DS4** Theme generator (90 min). Depends: DS3
  - `pnpm add culori` (add types if your editor wants them).
  - `src/stages/design/theme.ts`: brief to Theme, OKLCH targets from the spec,
    lightness nudged until contrast passes; entity sets; contrast table.
    THEME-001, 002, 004 with tests (THEME-003 lands with the apply step in S1).
  - Done when: for 12 hues times 3 chroma levels every theme passes THEME-001
    in light and dark (a property-style test).

- [ ] **DS5** Screens schemas (45 min). Depends: DS1, DS2
  - `makeScreensSchema` exactly as in the spec.
  - Done when: built from the fixture inventory, `Ia` and `ScreenNodes` pass
    `toJsonSchema` within Meta's limits (test).

- [ ] **DS6** Design validators (2.5 h). Depends: DS5
  - DESIGN-001 to 022 in `src/stages/design/validate.ts`; a small hand-written
    screens fixture for the reading-list app, one mutation per rule.
  - Done when: each rule has a passing and a failing test.

- [ ] **DS7** IA and nodes stage (90 min). Depends: DS3, DS4, DS6
  - `prompt-ia.md`, `prompt-nodes.md` (drafts provided); IA call, then one
    nodes call per screen with `p-limit(3)`; assemble `02-screens.json`; run
    whole-artifact rules; rerun only failing screens; write `02-ds-gaps.json`
    and append to `.weave-cache/ds-gaps.jsonl`.
  - Done when: golden freelancer workspace produces screens with zero mandatory issues.

- [ ] **DS8** Renderers (45 min). Depends: DS7
  - `02-design.md` as in the spec. Optional: `02-wireframes.html` (D3.6 D).
  - Done when: you can review any screen from the markdown alone.

- [ ] **DS9** Every golden idea (60 min). Depends: DS8
  - Run design for every golden flow set; the ecommerce store runs once untuned first, recorded; tune prompts; save golden `02-*`.
  - Done when: **G2**, including at least one justified new component for the
    dashboard editor.

## Phase 4: Contracts (Fri Oct 30, morning)

Spec: [specs/contracts.md](specs/contracts.md). Decisions: D4.1 to D4.6. Steps 24 to 29.

- [ ] **C1** Conventions and schema (40 min). Depends: FL1
  - `src/stages/contracts/conventions.ts` (the conventions table as data and
    functions: `pathFor(operation)`, `statusFor(code)`, built-in `User`) and `schema.ts`.
  - Done when: the schema passes `toJsonSchema`; unit tests for `pathFor` and `statusFor`.

- [ ] **C2** Compile (60 min). Depends: C1
  - `compile.ts`: per entity `createInput`, `updateInput`, `view`; per list operation `query`, `page`.
  - Done when: tests show sensitive fields missing from views, server fields
    missing from inputs, update inputs all optional.

- [ ] **C3** Validators (90 min). Depends: C2
  - CONTRACT-001 to 019 with fixtures (a hand-written reading-list contract and mutations).
  - Done when: each rule has a passing and a failing test.

- [ ] **C4** Prompt and stage, in parallel with design (40 min). Depends: C3, DS7
  - `prompt.ts` fills `src/stages/contracts/prompt.md` (draft provided);
    `weave run` runs design and contracts with `Promise.all` after flows, both
    recording the same flows version.
  - Done when: golden freelancer workspace produces a contract with zero mandatory issues.

- [ ] **C5** Renderer (30 min). Depends: C4
  - `03-contract.md` with paths from the conventions. Optional: `03-openapi.json`.
  - Done when: renders the golden freelancer-workspace contract.

- [ ] **C6** Every golden idea (40 min). Depends: C5
  - Save golden `03-contract.json` for each.
  - Done when: **G3**.

## Phase 5: Reconciliation and freeze (Fri Oct 30, afternoon to night)

Spec: [specs/reconciliation.md](specs/reconciliation.md). Decisions: D5.1 to D5.5. Steps 30 to 35.

- [ ] **R1** Coverage matrix (60 min). Depends: C6, DS9
  - `src/stages/reconcile/matrix.ts`: `buildMatrix`, data resolution as in the spec.
  - Done when: tests on the golden freelancer-workspace set; every row has screens
    and operations or is local.

- [ ] **R2** Mismatch rules (60 min). Depends: R1
  - RECON-001 to 011, each mismatch carrying its owner.
  - Done when: each rule has a passing and a failing test.

- [ ] **R3** Patches (60 min). Depends: R1
  - `patch.ts`: the three patch schemas and `apply*` functions.
  - Done when: tests for upsert, remove, cascading screen removal, refused
    entity removal, and unchanged items keeping their hashes.

- [ ] **R4** Patch prompts (40 min). Depends: R3
  - `prompt-patch-flows.md`, `prompt-patch-design.md`, `prompt-patch-contract.md` (drafts provided).
  - Done when: each fills from a sample mismatch list (test).

- [ ] **R5** Procedure, freeze, report (60 min). Depends: R2, R4
  - `procedure.ts` in the spec's order with 2 rounds per pass; `spec.lock.json`;
    `04-reconcile.md`. CLI: `--to freeze`.
  - Done when: golden freelancer workspace freezes.

- [ ] **R6** Seeded defects and every golden idea (60 min). Depends: R5
  - The three seeded defects from the spec as tests with recorded responses;
    then freeze every golden idea.
  - Done when: **G4**.

## Phase 6: Scaffold, theme and mock API (Sat Oct 31)

Decisions: D6M.1 to D6M.4, D7.2, D9.1. Steps 36 to 40. Replaces the backend:
the frozen contract is compiled into types, a typed client, TanStack Query
hooks, seed data and a mock API of Next.js route handlers backed by a JSON
file, all inside the generated app, by code and without model calls.

- [ ] **S1** Scaffold and theme apply (90 min). Depends: R6, DS4
  - `src/app/scaffold.ts`: copy `template/` to `runs/<id>/app` with
    `generate.mjs`, install, build the MCP. `src/app/theme.ts`: apply
    `02-theme.json` with `ts-morph` to `colors.ts` (primary and entity sets),
    `tokens.ts` (radius, focus ring) and `packages/styles/src/fonts.ts`;
    THEME-003 checks base, surface and status sets are untouched.
  - Done when: `pnpm weave run … --to scaffold` on the golden freelancer workspace
    yields an app whose `pnpm typecheck`, `pnpm mcp:check` and `pnpm verify /`
    pass, with the theme's colors in `colors.ts`.

- [ ] **S2** Contract codegen: types, client, hooks (90 min). Depends: S1, C2
  - `src/codegen/entities.ts` writes `web/app/entities/<entity>/` (zod schemas
    and types from `compile.ts`, `api.ts` on `Server`, `hooks.ts` on TanStack
    Query, `index.ts`) and `web/app/entities/auth/` (session hooks). `Server`
    learns the error envelope. A file ledger records every generated file.
  - Done when: the generated app typechecks and lints; a test compiles the
    golden contract and snapshots the output.

- [ ] **S3** Mock API: route handlers and JSON store (2.5 h). Depends: S2
  - `src/codegen/mockApi.ts` writes `web/mocks/seed.json`, `web/mocks/db.json`,
    `web/app/api/_mock/` (store with a write queue, http helpers, session) and
    one `route.ts` per path from the conventions: list, get, create, update,
    delete, action, and the four auth routes. Validation, access, pagination,
    filters, search, sort, relations on delete, lifecycle transitions, latency
    and forced failures come from the contract and the conventions.
  - Done when: `curl` against `pnpm dev` of the generated app creates a row
    that appears in `web/mocks/db.json` and in the next list call; every error
    code in the contract is reproducible.

- [ ] **S4** Contract tests against the mock (60 min). Depends: S3
  - `src/codegen/apiTests.ts` writes `web/app/api/__tests__/<entity>.test.ts`
    per entity: every operation's happy path and every listed error, pagination
    and sort, cascade on delete, unauthenticated and cross-user access, and data
    surviving a store reload (D8.4 A to D, applied to the mock).
  - Done when: `pnpm nx test web` passes in the generated freelancer workspace.

- [ ] **S5** Golden freelancer workspace to app (45 min). Depends: S4
  - `weave run … --to codegen` end to end; `pnpm build` of the app; record
    sizes and timings; fix codegen bugs found on the way.
  - Done when: **G5**.

## Phase 7: Frontend (Sun Nov 1)

Spec: [specs/design.md](specs/design.md) "Rendered checks". Decisions: D3.6 C,
D3.7, D3.10, D7.1 to D7.4, D9.1. Steps 41 to 47.

- [ ] **FE1** Coding engine: action loop with ownership and checks (2 h). Depends: F8, S2
  - `src/engine/loop.ts`: a structured-output action loop on the model layer
    (read, write, list, recipe, check, done), bounded turns and tokens,
    allowed write paths per session, every write recorded in the ledger,
    checks run through the app's own tools (validate, typecheck, lint, verify).
  - Done when: tests with a fake model show a write outside the allowed paths
    refused, a failing check fed back, and the loop ending on `done`.

- [ ] **FE2** Routes, navigation and page shells from screens (90 min). Depends: S2
  - `src/codegen/pages.ts`: for every page screen a route folder with a
    `page.tsx` shell (H1, sections with their node manifests as comments,
    `data-testid` per node), dialogs and drawers as files beside their page,
    navigation in `PageHeader`, a sign-in guard for `signedIn` screens.
  - Done when: the generated app builds and every route renders its H1;
    `pnpm verify` passes on every route.

- [ ] **FE3** New components (60 min). Depends: FE1, FE2
  - One loop session per `newComponents` entry writing
    `web/app/components/<Name>/` with the DS conventions and an axe test;
    validate, typecheck, lint and `nx test web` as checks.
  - Done when: the dashboard editor's new component passes its checks.

- [ ] **FE4** Pages: sections wired to hooks (2.5 h). Depends: FE3
  - One loop session per screen filling the shell's sections from the nodes,
    using recipes, the entity hooks and the DS, with loading, empty, error,
    invalid and submitting states; `pnpm verify <route>` as the last check.
  - Done when: every freelancer-workspace route passes validate, typecheck, lint
    and verify, and the core loop works by hand.

- [ ] **FE5** Rendered checks (90 min). Depends: FE2
  - `src/checks/`: DESIGN-R-001 to 009 with Playwright (axe, contrast, keyboard
    walk, target size, overflow, first viewport, type size, color variables,
    proximity), written as reusable collectors the benchmark reuses.
  - Done when: each rule has a test on a fixture page; the freelancer workspace's
    routes pass the mandatory rules.

- [ ] **FE6** Visual rubric (45 min, optional). Depends: FE5
  - Screenshots to Muse Spark, scored 0 to 4 per concern with evidence
    (D3.8 A); warnings only.
  - Done when: a rubric report exists for the freelancer workspace.

- [ ] **FE7** Golden freelancer workspace end to end (60 min). Depends: FE4, FE5
  - `weave run … --to frontend`; walk every flow by hand on the mock API.
  - Done when: **G6**.

## Phase 8: Benchmark (Mon Nov 2, morning)

Decisions: D13.1 to D13.5. Steps 48 to 54. Runs right after generation and
again after repairs; one table with every number.

- [ ] **B1** Production build and server (45 min). Depends: S5
  - `src/bench/server.ts`: `next build`, then `next start` on a free port with
    a fresh seeded store; gzip, ETag and immutable static caching confirmed by
    the runner; security headers in the template's `next.config.js`.
  - Done when: the runner starts and stops the server and asserts
    `content-encoding: gzip` on a page response.

- [ ] **B2** Lighthouse (60 min). Depends: B1
  - `src/bench/lighthouse.ts`: Lighthouse 13 through its Node API on
    Playwright's Chromium, mobile and desktop, per route, signed in through a
    cookie header; scores, LCP, FCP, CLS, TBT, Speed Index, bytes, DOM size;
    JSON and HTML reports saved.
  - Done when: `benchmark/lighthouse/*.json` exists for every route of the
    freelancer workspace.

- [ ] **B3** Accessibility: axe, contrast, targets (45 min). Depends: FE5, B1
  - Reuse the FE5 collectors on the production server: axe violations by
    impact, contrast failures, small targets, per route and state.
  - Done when: `benchmark/accessibility.json` lists counts per route.

- [ ] **B4** Screen reader (60 min). Depends: B1
  - `src/bench/screenReader.ts`: the accessibility tree per route (aria
    snapshot) and a virtual screen reader pass: unnamed controls, landmark
    coverage, heading outline, labelled fields, dialog naming and focus, live
    regions, and the spoken phrase log saved per route.
  - Done when: `benchmark/screen-reader/*.txt` and counts per route exist.

- [ ] **B5** Keyboard navigation (60 min). Depends: FE5, B1
  - `src/bench/keyboard.ts`: Tab walk per route: reachability, focus visible,
    order against reading order, traps, Escape on dialogs, Enter and Space on
    controls, skip link.
  - Done when: `benchmark/keyboard.json` has percentages per route.

- [ ] **B6** Code quality and duplicates (90 min). Depends: S5
  - `src/bench/code.ts`: tsc, ESLint by rule, MCP validate by rule (with a new
    `--json` flag), jscpd clones and duplicated percentage, design-system
    duplicates (hand-built elements, near-named components, native controls
    in new components, data access outside entities), knip unused code,
    first-load JS per route from the build manifests, lines by origin from
    the ledger.
  - Done when: `benchmark/code.json` exists for the freelancer workspace with a
    deliberately planted duplicate detected.

- [ ] **B7** Benchmark table and CLI (60 min). Depends: B2 to B6
  - `src/bench/report.ts`: `benchmark.json` (every metric with value, unit,
    threshold, verdict) and `05-benchmark.md` (summary, per-route table, code
    table, deltas against the previous benchmark of the run). `weave bench
    <runId>`; `weave run` runs it after `frontend` and after `repair`.
  - Done when: **G7** part one: the freelancer workspace's table is generated and
    every threshold has a verdict.

## Phase 9: Tests and repair (Mon Nov 2, afternoon to Tue Nov 3)

Spec: [specs/flows.md](specs/flows.md) for the inputs. Decisions: D8.1 to
D8.4. Steps 55 to 58.

- [ ] **T1** Playwright tests from the frozen flows (2 h). Depends: R6, FE2
  - `src/stages/tests/`: one `@playwright/test` spec per flow in `web/e2e/`,
    generated by code from steps, fields, alternatives and node IDs; the model
    only turns outcomes into assertions (structured call); a Playwright config
    with a seeded store and a `pnpm test:e2e` script in the app.
  - Done when: the golden freelancer workspace gets one spec per flow that compiles.

- [ ] **T2** Run, evidence, repair requests (60 min). Depends: T1, FE7
  - Run the specs, map failures to flow, step and screen, attach screenshot
    and trace, and write typed repair requests (D8.3 A); `06-e2e.md`.
  - Done when: the evidence table and the requests exist for a run with a
    planted defect.

- [ ] **T3** Bounded repair (90 min). Depends: T2, FE1
  - A loop session per repair request, allowed paths limited to the screen's
    route and components, tests read-only, 2 rounds, rerun only the failed
    specs; benchmark again after repairs.
  - Done when: the planted defect is repaired within the limits; a spec edit
    attempted by the model is refused and logged.

- [ ] **T4** Golden freelancer workspace e2e green (45 min). Depends: T3
  - Done when: **G7**.

## Phase 10: Prove and submit (Tue Nov 3 to Wed Nov 4)

Decisions: D1.10 B, D12.1, D12.2. Steps 59 to 62.

- [ ] **P1** Run dashboard (90 min). Depends: B7
  - `src/dashboard/`: one static `dashboard.html` per run from `events.jsonl`,
    reports, the benchmark and screenshots.
  - Done when: `pnpm weave show <id> --html` opens a dashboard with the
    timeline, issues per round, the coverage matrix and the benchmark table.

- [ ] **P2** Two full runs, a Modal run, benchmarks (3 h). Depends: T4, F8, P1
  - Freelancer workspace and ecommerce store end to end without manual edits
    (or every edit logged); one run on Muse Spark Open through Modal; both
    benchmarked; numbers into `fixtures/golden/README.md`.
  - Done when: **G8**.

- [ ] **P3** README and submission answers (90 min). Depends: P2
  - Root `README.md` with the pipeline, the numbers, the gaps, and a section
    that separates the hackathon work from the pre-existing design system
    (required by the rules); `docs/SUBMISSION.md` with the form's answers.
  - Done when: a reader can tell what was built this week from the README alone.

- [ ] **P4** Demo video and submit (2 h). Depends: P3
  - 3-minute script and recording; upload; submit the form; optional X post.
  - Done when: **G9**.

---

## Parked (after the hackathon)

Backend (OPTIONS.md section 6, Track B), packaging and deployment (sections
10 and 11). The mock API keeps the contract's HTTP shape, so a real backend
replaces it behind the same typed client.

## If a day slips, cut in this order

The benchmark is the proof of the project: nothing in Phase 8 is cut, and
its routes, states and tools stay as D13 says.

1. Wireframe HTML (D3.6 D) and the OpenAPI export (about 45 min)
2. Visual rubric (FE6, 45 min)
3. Muse Image moodboard (D3.3 C) if it was ever started
4. The dashboard (P1) trimmed to the timeline and the benchmark table (saves
   about 45 min); the markdown reports carry the rest
5. The Modal run (P2) stopped after `freeze` instead of a full run (saves
   about 1 h; the open-weights prize needs the run to exist, not to be long)
6. Parallel design and contracts (run them one after the other)
7. Second round of each reconciliation pass
8. The second repair round (T3); report what is still open instead

Never cut: schemas, validators, golden fixtures, the coverage matrix, the
template-based scaffold, the whole benchmark phase. They are what keeps the
output from drifting and what proves it, which is the whole idea.

## Risks

| Risk                                                         | Mitigation                                                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Meta's API rejects a schema shape                            | F2 sanitizes and F4 smoke-tests every construct used; keep schemas flat                     |
| Credits run out                                              | Replay cache, golden fixtures for offline work, Spark by default, costs logged per call     |
| Design outputs too big or inconsistent                       | IA first, then per-screen nodes (D3.11 B); per-screen reruns                                |
| Phases 6 to 9 get one day each                               | The contract compiler (C2) feeds codegen; page shells are code; the model fills sections    |
| The model writes outside its files or edits tests           | The loop refuses writes outside the allowed paths and logs the attempt (FE1)                |
| Lighthouse or the browser won't start on WSL                 | Playwright's Chromium with `--headless=new`; every tool in the benchmark is optional per run |
| Prompt tuning turns into validator weakening                 | AGENTS.md forbids it; rule changes go through you                                           |
| A hosted endpoint rejects or mishandles `json_schema`         | Verified on Modal and Baseten 2026-10-29; the smoke test checks it before any run          |
