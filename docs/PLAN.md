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
| G1   | Oct 29, 01:30 | Freelancer workspace and dashboard editor produce scope and flows with zero mandatory issues; ecommerce store (unseen) run once untuned and recorded, then passes too; golden fixtures saved (done) |
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
  - `src/runner/runSpecStage.ts` as in ARCHITECTURE "Stage runner" (D1.5 A, D1.6
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

- [x] **F8** Open-weight model backends (2 h) (done 2026-10-29). Depends: F4, F7. Decision D1.11.
  - Closed after FL5: both smoke tests passed earlier. Run
    `20261029-2125-freelancer-workspace` (`--to scope --backend modal`)
    finished in 3 rounds with 0 known issues, and all 5 `llm:call` events
    carry `"backend":"modal"`. The endpoint was cold: it answered 503 for
    112 s, so it was warmed with `GET /models` before the run (F9).
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

- [x] **F9** Model client follow-ups (30 min) (done 2026-10-30). Depends: F3, F6
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
  - Done 2026-10-30 without the reasoning budget: tuning it needs a Glimmer run.

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
    (`src/runner/review.ts`) listing major blockers only; blockers are mandatory
    issues with rule `REVIEW` for the next fix.
  - Prompts in `src/runner/prompt-review.md` (reviewer rules, the ignore list)
    and `prompt-review-input.md`; each stage adds a `review-<stage>.md` guide.
  - Done when: `runSpecStage.test.ts` covers the schedule (calls per round,
    skipped fixes, early end, known issues after round 4, no reviewers without
    a guide); `pnpm test`; `pnpm typecheck`.

- [x] **F12** Peer and output reviewers (60 min) (done 2026-10-30). Depends: F10. Decision D1.12
  - Why: one guide sampled twice asked each reviewer to both challenge the
    decisions and find errors in the output (user, 2026-10-30).
  - Round 2 runs a peer, who challenges the decisions, and an output
    reviewer, who finds errors in meaning the validators cannot; round 3 runs
    the output reviewer alone. `runSpecStage` takes `review: { peer, output }`.
  - Scope, catalog and expansion guides split into `review-<call>-peer.md`
    (the product manager) and `review-<call>-output.md`. Design gets
    `review-brief-peer.md` and `review-brief-output.md` for the brief, and
    `review-screens-peer.md` and `review-screens-output.md` (with H-42, H-53
    and H-59) for the IA and nodes calls, the peer a product designer; DS3
    passes `briefReviewGuides()` and DS7 `screensReviewGuides()`. The shells
    are reviewed with the theme stage.
  - Done when: `runSpecStage.test.ts` shows the peer and output reviewer in
    round 2 and the output reviewer alone in round 3; `pnpm test`;
    `pnpm typecheck`.

- [x] **F13** Reasoning levels and temperatures (30 min) (done 2026-10-30). Depends: F12. Decision D1.13 C, D1.8
  - Why: scope and the brief set the direction and need room to be creative;
    the calls after them pick exact values (user, 2026-10-30).
  - Two temperatures, 0.2 and 0.7. `runSpecStage` takes `temperature` for
    the first draft; fixes and both reviewers run at 0.2 (user, 2026-10-30).
    Scope runs at high and drafts at 0.7; catalog, expansion and patches
    keep medium and 0.2. DS3 and DS7 set the design calls.
  - A strong call on a backend without its own strong model (Modal, Baseten,
    or `LLM_MODEL_STRONG` empty) goes to the base model one level up: medium
    to high, high to xhigh, never max.
  - Done when: `llm.test.ts` covers both strong routes and the step up;
    `runSpecStage.test.ts` shows the first draft at the stage's temperature
    and fixes and reviewers at the default; `pnpm test`; `pnpm typecheck`.

## Phase 2: Scope and flows (Oct 28, night to Oct 29, 01:30)

Spec: [specs/flows.md](specs/flows.md). Decisions: D2.1 to D2.7. Steps 09 to 14.

- [x] **FL1** Capabilities and schemas (40 min) (done 2026-10-29). Depends: F2
  - `src/agents/01flows/config/capabilities.ts` and `src/agents/01flows/schema.ts`, as in the spec.
  - Done when: a test passes both schemas through `toJsonSchema`; `pnpm typecheck`.

- [x] **FL2** Validators with tests (90 min) (done 2026-10-29). Depends: FL1
  - Every SCOPE and FLOW rule in `src/agents/01flows/04reconcile/validation/validation.ts`.
  - Fixtures in `src/agents/01flows/__fixtures__/`: a small hand-written valid
    scope and flows for a reading-list app (5 flows; deliberately not one of the
    reference ideas, because its flow becomes the prompt's format example), and
    one mutation per rule.
  - Done when: each rule has a passing and a failing test; `pnpm test` is green.

- [x] **FL3** Prompts (30 min) (done 2026-10-29). Depends: FL1
  - Review and finish `src/agents/01flows/01scope/prompts/prompt.md` and `prompt-flows.md`
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
  - `src/agents/01flows/render.ts`: `01-flows/01-scope.md` (short) and `01-flows/04-reconcile.md` in the spec's format.
  - Done when: a snapshot test renders the valid fixture.

- [x] **FL8** Product-manager standard shared by the scope and flows prompts (60 min) (done 2026-10-29). Depends: FL7, F11
  - Added 2026-10-29 by the user: the two prompts and the two review guides
    carried four drifting copies of what a product manager checks.
  - `src/agents/01flows/prompts/product-manager.md`: the MVP decisions and the measures
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

- [x] **FL9** Flows in three stages: catalog, expand, reconcile (7 h) (done 2026-10-29). Depends: FL5, FL8. Decisions: D2.1 E, D2.3
  - Added 2026-10-29 by the user: one call cannot write the flows of a detailed
    idea (freelancer workspace: 83k characters and unfinished at 64k tokens).
  - `flows-catalog`: headers and descriptions, reusable fields, forms and
    subflows, assumptions, questions; its own rules and reviewer.
    `flows-expand`: batches of 8 ids, each a stage run in parallel, expanding
    while reusing parts by name; assembled into a draft. `flows`:
    reconciliation that starts from the draft, validates everything and
    fixes by patches, without reviewers. Runner gains `start` and `compose`.
  - Done when: `pnpm test`, `pnpm typecheck`, and `pnpm weave run
    fixtures/ideas/freelancer-workspace.md --to flows` completes with a
    readable `01-flows/04-reconcile.md`; `weave show` lists the batches.

- [x] **FL5** Wire the stage (30 min) (done 2026-10-29). Depends: FL2, FL3, FL4, F7, F10
  - Its live check ran as FL9's: freelancer workspace to flows, three stages, zero known issues.
  - `src/agents/01flows/stages.ts`: scope, then flows. With `--interactive`
    each stage passes `ask` to the runner (F11): the blocking, unanswered
    questions are asked on the terminal with their defaults after each new
    draft, and every answer is saved to `input/answers.json`. Register in
    the CLI.
  - Added 2026-10-29 (F10): `review-scope.md` and `review-flows.md`, the
    review guides each stage passes to the runner.
  - Done when: `pnpm weave run fixtures/ideas/freelancer-workspace.md --to flows`
    ends with zero mandatory issues or a readable `StageFailed` report.

- [x] **FL10** Standard subflows (60 min) (done 2026-10-29). Depends: FL9. Decision D2.8 B
  - Added 2026-10-29 by the user: the confirmation subflow does not change
    per website, so it is written once and always available; the registry
    takes design-system subflows later.
  - `src/agents/01flows/config/subflows.ts` (registry, `withStandardSubflows`, the prompt
    list and the first free id); the catalog stage injects them before
    validation and into the artifact; the catalog and expand messages and the
    catalog reviewer name them; the renderer marks them; fixtures use SF01.
  - Done when: `pnpm test`; `pnpm typecheck`.

- [x] **FL11** Word-matching rules move to the reviewers (30 min) (done 2026-10-29). Depends: FL9
  - Added 2026-10-29 by the user: a rule that guesses from the model's
    wording fires on false matches (the ecommerce run: "checkout" and "UPI
    paid" read as payments, "3 left" as layout), so a reviewer judges these.
  - Removed FLOW-010, FLOW-017, FLOW-018, FLOW-022, CAT-004 and SCOPE-004
    with their mutations and tests, and `wholeWords`, `escapeRegExp`,
    `containerTexts` and `explanations`. Each review guide lists its share
    under "Non-deterministic checks": the scope guide skipped capabilities;
    the catalog guide in-scope coverage, records never edited or deleted, and
    wording; the expand guide capabilities and wording.
  - Done when: `pnpm test`; `pnpm typecheck`.

- [x] **FL12** Choice fields whose options come from records (20 min) (done 2026-10-29). Depends: FL1
  - Added 2026-10-29 by the user: a choice field cannot take its options
    from records, so the ecommerce catalog took 4 rounds (the glaze choice
    must offer the glazes the owner manages, and FLOW-005 asks for at least 2
    fixed options).
  - A field gets `optionsFrom`: the vocabulary noun whose records are the
    options, or "" for fixed options. The flows prompt asks the model to set
    it. FLOW-005 asks for 2 or more options only when `optionsFrom` is "",
    and checks that a non-empty `optionsFrom` is a vocabulary noun.
  - Done when: `pnpm test`; `pnpm typecheck`.

- [x] **FL13** Golden flows from the new settings (10 min) (done 2026-10-30). Depends: F13, F14
  - Why: today's runs with scope at high and 0.7 and the peer and output
    reviewers gave more complete specs and caught real defects (user,
    2026-10-30: adopt them).
  - `fixtures/golden/<idea>/` now holds `runs/20261030-1630-<idea>`'s scope,
    catalog and flows; the README table and note follow.

- [x] **FL6** Reference ideas (60 min) (done 2026-10-29). Depends: FL5, FL9
  - Tuning notes from the freelancer run (2026-10-29), to apply to the prompts
    before the next runs: writers' first drafts skipped the "empty" path on
    list steps and the "confirm or cancel" path on deletes (FLOW-012 and
    FLOW-013 fired 10 times in round 1) and put the delete on the step itself
    although the catalog had a "Confirm deletion" subflow; "top" and "right"
    slipped into step text (FLOW-018). Validators stay as they are.
  - Applied 2026-10-29: the expand message ends with a checklist (empty paths,
    deletes through the confirmation subflow, invalid and failure paths, no
    layout words); the catalog message asks for a confirmation subflow.
  - Rule change on the user's decision, 2026-10-29: FLOW-013 accepts the
    back-out on the deleting step or the step right before it, including
    through a confirmation subflow. Reason: the ask-then-confirm pattern puts
    the cancel on the asking step, and the old rule made every batch fight
    the catalog's subflow (freelancer rerun: 4 rounds per batch, $2.43). Also
    fixed: the catalog stage validates its subflows' steps; a batch is
    checked on its own flows and new parts only; the MVP flow count does not
    run per batch.
  - Superseded the same day (user): the deletion happens inside STD01, the
    step that runs it carries the delete effect, and FLOW-013 checks that
    step alone: its own confirm or cancel path, or a subflow that has one.
  - Tune on the freelancer workspace and the dashboard editor: change
    prompts, never validators, until each passes within 3 rounds. Read every
    `01-flows/04-reconcile.md` and fix the prompt for anything you'd reject.
  - Then run the ecommerce store once, untuned: it's the unseen test. Record
    what happened, even if it fails. After that it joins tuning until it
    passes too; it is the second end-to-end idea (G8).
  - Save accepted artifacts to `fixtures/golden/<idea>/01-scope.json` and
    `01-flows/04-reconcile.json`; record rounds, tokens and cost per idea in
    `fixtures/golden/README.md`.
  - Done when: **G1**.

## Phase 3: Design (Thu Oct 29)

Spec: [specs/design.md](specs/design.md). Decisions: D3.1 to D3.11. Steps 15 to 23.

- [x] **DS1** Design-system inventory (45 min) (done 2026-10-29). Depends: F1
  - `src/ds/inventory.ts`: runs `node template/tools/export-design-system.mjs`
    with execa; caches in `.weave-cache/inventory-<hash>.json`, keyed by a hash
    of `template/packages/*/src/**`, `template/tokens.ts`, `template/colors.ts`;
    exports `inventory()`, `inventorySummary()`, `spacingKeys()`, `radiusKeys()`.
  - Copy one real export to `src/ds/__fixtures__/inventory.json` for tests.
  - `pnpm weave ds` prints counts and the summary's size.
  - Done when: a cached call returns in under 200 ms; the summary of the
    fixture is under 6 KB and lists every component with its variant values.

- [x] **DS1b** Fixed box dimensions (2 h) (done 2026-10-29). Depends: DS1
  - Why: the design stage lays out and validates with fixed heights (a Button
    is 32px or 40px tall, an Accordion header one row); many come from padding
    plus line height or from the implementation, so a browser render is the
    only reliable source.
  - `template/packages/ui/src/Measure.stories.tsx` renders every case with
    short and long content; `template/tools/measure-design-system.mjs` reads
    each root and part box on the running Storybook (6006, like `pnpm verify
    --recipes`) and prints what stayed equal; `inventory()` stores it as `box`
    per component, size and part. A real measurement is the fixture, so tests
    and runs never need Storybook.
  - Done when: the rebuilt inventory lists Button sm 32 and md 40, FormControl
    boxes, Avatar sizes, Dialog widths and an Accordion trigger height;
    `pnpm test` and the template's lint and typecheck pass.

- [x] **DS1c** Container paddings and gaps (30 min) (done 2026-10-30). Depends: DS1b
  - Why: the layout skeleton needs each container's inner padding and gap
    (Card, Section, Dialog body, Table cell), not only its outer box.
  - The measure tool also reads computed padding and gap of every case root
    and part; the inventory stores them under `box` as `padding` and `gap`.
  - Done when: the fixture lists Card padding and Section gap; a test checks each.

- [x] **DS2** Design config (20 min) (done 2026-10-30). Depends: F1
  - `src/agents/02design/config.ts`: templates, section kinds, element tags, the
    superseded-tag fallback map, the new-component budget.
    `src/agents/02design/01brief/fonts.ts`: font allowlists with weights.
  - Done when: `pnpm typecheck`.

- [x] **DS3** Brief (60 min) (done 2026-10-30). Depends: DS1, DS2, FL6
  - Brief schema, `prompt-brief.md`, BRIEF rules with tests.
  - The brief is the direction (D3.3 E, user, 2026-10-30): its output is
    small and sets the whole look, so it runs at high reasoning and
    temperature 0.7 (D1.13 C), and the theme call turns it into exact values. Besides
    audience, personality, voice, density, seed hue and chroma, fonts,
    radius, focus ring, imagery and references, it decides:
    - `feel`: 1 or 2 words for the site's style, such as minimal, designer,
      metro or retro;
    - `colorScheme`: light, dark or both;
    - `entities`: every noun in the scope's vocabulary, colored or not, with
      a hue when colored; at most 3 colored. It replaces `entityColors`.
    - `pageHue` and `pageChroma`, `frameHue` and `frameChroma`: the page
      background and the frame around it (user, 2026-10-30); chroma
      `neutral` is white or grey. The theme call builds `pageBg` and
      `frameBg` from them.
  - BRIEF-001 checks the page and frame hues, counts feel words and colored entities; BRIEF-002 checks the
    entities are the vocabulary's nouns, each once. `shells` leave the brief
    with BRIEF-003 and BRIEF-004; DS4a frames the pages in the theme call.
    The brief prompt no longer gets the design system's prose (user,
    2026-10-30).
  - Done when: golden freelancer workspace produces a brief with zero mandatory issues.
  - `brief` and `theme` are pipeline stages before `design`, tested with a
    fake model. The live run on `runs/20261030-1630-freelancer-workspace`
    (2026-10-30) wrote both in 2 rounds each with 0 known issues and no
    blockers, for $0.19; THEME-006 caught a 60 tall header that could not
    hold a button and its padding, and the theme's fix made it 64.

- [x] **DS4** Theme generator (90 min) (done 2026-10-30). Depends: DS3
  - `pnpm add culori` (add types if your editor wants them).
  - `src/agents/02design/02theme/build.ts`: brief to Theme, OKLCH targets from the spec,
    lightness nudged until contrast passes; entity sets; contrast table.
    THEME-001, 002, 004 with tests (THEME-003 lands with the apply step in S1).
  - Done when: for 12 hues times 3 chroma levels every theme passes THEME-001
    in light and dark (a property-style test).
  - Built 2026-10-30 ahead of DS3's golden run; the theme's three fonts come
    from the brief, mono included. `runTheme` comes with the design stage.

- [x] **DS4a** Theme call (4 h) (done 2026-10-30). Depends: DS3, DS4, DS7c
  - Why: the model picks every final value from the brief in one call: the
    colors, the page layouts and the component defaults; code checks
    contrast instead of building the palette (D3.3 E, user, 2026-10-30).
  - `prompt-theme.md` and `makeThemeSchema(brief, inventory)`: one call at
    medium reasoning and temperature 0.2, with the brief, the scope and the
    flows as input.
  - Colors. For each mode the brief's `colorScheme` names, it writes:
    - the theme's 12 color roles;
    - `pageBg`, `pageFg`, `pageFgMuted` and `frameBg`;
    - the 12 roles for each colored entity, from its hue.
  - `divider`, `backdrop` and `skeleton` stay the template's for every app.
  - `theme.ts` loses the palette builder (`buildColorSet`, the lightness and
    chroma tables); `buildTheme` adds fonts, radius, focus ring and density
    from the brief, and the contrast table. `runTheme` joins the design stage
    after `runBrief`, with DS3's run, which writes `stage.ts`.
  - THEME-001 adds `pageFg` and `pageFgMuted` on `pageBg` and on `frameBg`.
    A failing pair goes back to the theme call in its fix rounds. THEME-005
    checks every color is hex; THEME-006 checks the layouts.
  - DS4's test over 12 hues goes; a theme fixture with one mutation per rule
    replaces it. The spec's Theme section follows.
  - Page layouts. The frame is part of the look, so an `app` and a
    `marketing` layout replace the shells. Each says:
    - which docks first: the header across the full width, or the sidebars
      down the full height;
    - header: needed or not; what it holds at the start, center and end; its
      height; sticky or scrolling; over the hero or above it;
    - sidebar: needed or not; left or right; what it holds at the top and the
      bottom; its width; sticky or scrolling;
    - extra sidebar: the same fields as the sidebar;
    - footer: needed or not; what it holds at the start, center and end; its
      height;
    - for the header, the sidebars and the footer: padding, gap, and how each
      sets off from the content: frame background, divider, shadow or none;
    - main content: fluid or a fixed container with a max width, padding,
      alignment, the gap between sections, and whether section backgrounds
      run the full width while their content stays in the container.
  - Phones are out of scope for now (user, 2026-10-30).
  - IA: a page's `shell` becomes `framed`: true uses its kind's layout, false
    has no frame (sign in, errors). Dialogs and drawers are never framed
    (DESIGN-023). The layout's `main` sets every page's container, padding
    and section gap; a page's `contentWidth` only narrows its column inside
    the container (user, 2026-10-30).
  - `resolve.ts` turns each layout into a shell, SH1 for app and SH2 for
    marketing, its needed parts as regions in docking order (user,
    2026-10-30), so the solver, DESIGN-024 and 025, LAYOUT-070 and the nodes
    calls keep reading shells. The shell id and region box checks are true by
    construction. The prompts, renderer, fixtures and the spec follow.
  - Defaults. One choice per component keeps pages consistent: the call
    picks, for every component in the inventory, a default for each of its
    variant props and its look, from that component's own values. Nodes
    leave `size` and `look` "" for the default; code fills the defaults in
    before the validators, and the coding stage gets them with the nodes.
    `prompt-nodes.md` says this.
  - Done when: `pnpm typecheck` and `pnpm test` pass; the theme schema passes
    `toJsonSchema` within Meta's limits (test); a solver test docks a
    header-first and a sidebars-first layout with both sidebars and a footer
    to known rectangles; the reading-list fixture passes every rule with a
    header over the hero on marketing pages and no frame on sign in; a node
    with "" gets its component's default (test).

- [x] **DS4b** Theme review guides (20 min) (done 2026-10-30). Depends: DS4a
  - Found in DS4a: the theme call has no `review-theme-peer.md` and
    `review-theme-output.md`, so no reviewer calls run on it (D1.12).

- [x] **DS4c** Main content separation (15 min) (done 2026-10-30). Depends: DS4a
  - Why: the header, sidebars and footer say how they set off from the
    content, but the content area could not be a bordered or raised panel
    (user, 2026-10-30).
  - `main.separation` takes the parts' four values; the prompt, the
    renderer, the reading-list theme and the spec follow.
  - Done when: `pnpm typecheck` and `pnpm test` pass, and `02-design/09-assemble.md`
    shows a main separation other than none.

- [x] **DS5** Screens schemas (45 min) (done 2026-10-30). Depends: DS1, DS2
  - `makeScreensSchema` exactly as in the spec, box model and new-component
    layout and behavior prose included (user, 2026-10-30).
  - Done when: built from the fixture inventory, `Ia` and `ScreenNodes` pass
    `toJsonSchema` within Meta's limits (test).

- [x] **DS6** Design validators (2.5 h) (done 2026-10-30). Depends: DS5
  - DESIGN-001 to 022 in `src/agents/02design/rules/index.ts`; a small hand-written
    screens fixture for the reading-list app, one mutation per rule.
  - Done when: each rule has a passing and a failing test.

- [x] **DS6b** Layout solver and skeleton (2.5 h) (done 2026-10-30). Depends: DS5, DS1c
  - Why: design is the product's main strength; a page must be checkable as
    composition before any code exists.
  - `src/agents/02design/09assemble/skeleton/skeleton.ts`: from the nodes' boxes, the inventory boxes
    and the type scale, a deterministic row, column and grid solver computes a
    rectangle per node at 1280 and 375; written as `02-design/09-skeleton.json`;
    `02-design/09-wireframes.html` draws the rectangles as lines.
  - Done when: the golden freelancer workspace renders every screen as lines
    with no overlap, and a hand-built fixture page solves to known rectangles.

- [x] **DS6c** Layout rules from the heuristics catalog (3 h) (done 2026-10-30). Depends: DS6b
  - Why: the catalog in `specs/layout-heuristics.md` holds the rules that
    separate composed from generated; the user reviewed it on 2026-10-30 and
    every rule left in it is accepted.
  - Each rule becomes `LAYOUT-0NN`, matching `H-NN`, checked on the skeleton
    at both viewports, with a passing and a failing fixture. The rules marked
    prompt only go to DS7's prompts and the reviewer guidance instead.
  - Done when: every rule has its tests and is ticked in the catalog, and the
    fixture screens pass the mandatory ones.

- [x] **DS7a** Prompts describe the layout fields (15 min) (done 2026-10-30). Depends: DS6b
  - Found in DS6b: `prompt-ia.md` and `prompt-nodes.md` do not mention the
    screen `layout`, the section `box`, or that an input with no visible
    label (`text` "") is drawn as its box alone; the skeleton reads all three.
  - Done with DS7e's prompt rewrite.

- [x] **DS7b** Page kind replaces screen templates (45 min) (done 2026-10-30). Depends: DS6c, DS8
  - Why: the layout fields already carry the layout (D3.5 B); the template
    only splits inner pages from public ones, and its eight values push pages
    like pricing or checkout into the wrong one.
  - Screen `template` becomes `kind: 'app' | 'marketing'`; `SCREEN_TEMPLATES`
    and `INNER_TEMPLATES` leave `src/agents/02design/config.ts`. DESIGN-006, LAYOUT-008
    and `prompt-ia.md` read `kind`; DESIGN-021 exempts every marketing page,
    not only the landing page; `02-design/09-assemble.md` and the wireframes show the
    kind. The spec, the reading-list fixture and the snapshots follow.
  - Done when: `pnpm typecheck` and the design tests pass, and no
    `SCREEN_TEMPLATES`, `INNER_TEMPLATES` or `screen.template` is left.

- [x] **DS7c** Shells replace the fixed page frame (2 h) (done 2026-10-30). Depends: DS7b
  - Why: one top bar 56 tall or one sidebar 240 wide for every app makes every
    generated site look the same (user, 2026-10-30).
  - The brief call designs shells: regions docked in order to the top,
    bottom, left or right, or over the page, with boxes and layouts; each page
    picks one or none. Shell nodes (`SH1.n01`) fill the regions and show on
    every page using the shell. `navigation.model` and `FRAME_PX` go. The
    solver docks the regions; BRIEF-003, BRIEF-004, DESIGN-023 to 025 and
    LAYOUT-070 (new H-70) check them; DESIGN-001, 003, 008, 010 and 017 count
    shell nodes. DS7 runs one nodes call per used shell.
  - Done when: `pnpm typecheck` and `pnpm test` pass, a solver test docks
    left, top, right and bottom regions to known rectangles, and the
    reading-list fixture passes every rule with an overlay header on the
    landing page and no shell on sign in.
  - Superseded the same day by DS4a: the theme's page layouts make the
    shells, and BRIEF-003 and BRIEF-004 are gone.

- [x] **DS7d** Validators skip design-system internals (30 min) (done 2026-10-30). Depends: DS7c
  - Why: the design system's components are stable; validators check what
    the model composes, not a component's own size or padding (user,
    2026-10-30).
  - DESIGN-002 drops its height warning; LAYOUT-014 drops card and dialog
    padding; LAYOUT-026 drops button width; LAYOUT-066 drops clearance from a
    card's or dialog's edge. The fixed dialog widths are not checked.
  - The solver reads dialog widths from the inventory's Dialog sizes;
    `DIALOG_WIDTH_PX` and `DIALOG_MARGIN_PX` go, and a full dialog is lg.
  - Done when: `pnpm typecheck` and `pnpm test` pass, and each narrowed rule
    still fires on its mutation.

- [x] **DS7e** Design flow review (2 h) (done 2026-10-30). Depends: DS7d, F13
  - Why: a day of decision changes left stale prompts, rules that bad output
    could pass, and theme values no later call could fix (user, 2026-10-30).
  - Prompts: `prompt-ia.md` and `prompt-nodes.md` rewritten on the current
    schemas, with `prompt-ia-input.md` and `prompt-nodes-input.md`; the brief
    and theme prompts and four review guides lose stale lines.
  - Rules: THEME-007 (frame spacing), THEME-008 (defaults that carry
    meaning), DESIGN-026 (an interactive node names a component); THEME-001
    and 002 check the theme's link colors on the page and the frame;
    DESIGN-009 also runs on the IA; DESIGN-011 counts node states only;
    DESIGN-015 keeps H1s out of shells; DESIGN-023 wants a frame for a
    framed page; DESIGN-025 matches the item's access;
    `validateScreenNodes` takes the screen the call fills.
  - The reading-list fixture gains a node for each state its IA lists.
  - Done when: `pnpm typecheck` and `pnpm test` pass.

- [ ] **DS7** IA and nodes stage (90 min). Depends: DS3, DS4, DS6, DS4a, DS12, DS13
  - The prompts are written (DS7e); `prompt.ts` adds their builders. Then
    the IA call, one nodes call per screen and per used shell with
    `p-limit(3)`, every call at temperature 0.2, the IA at high reasoning
    and the nodes calls at medium (D1.13 C); each call's nodes get `withDefaults` before
    `validateScreenNodes`; `resolveScreens` assembles `02-design/09-assemble.json`;
    the whole-artifact and layout rules run, and their issues go back to the
    call that owns the value (DS12); write `02-design/09-skeleton.json`,
    `02-design/09-wireframes.html`, `02-design/09-assemble.md` and `02-design/09-ds-gaps.json`, and append to
    `.weave-cache/ds-gaps.jsonl`.
  - The step file says how: `docs/steps/21-DS7-ia-nodes-stage.md`.
  - Done when: golden freelancer workspace produces screens with zero mandatory issues.
  - The IA call starts at the 64k output cap: its output, reasoning included,
    is estimated at 20 to 30k tokens for a 17-flow app, and a cut first try
    is billed before the doubling (user, 2026-10-30).
  - Built 2026-10-30: the IA and nodes prompt builders, `stage-screens.ts`
    (`runDesign`, registered as `design`), routing (DS12) and the look
    (DS13), tested with a fake model, a routed rerun included.
  - First live run, 2026-10-30, `runs/20261030-1630-freelancer-workspace`
    from the brief: 18 screens, 44 sections, 488 nodes, 2 new components;
    163 calls, 33 minutes, $12.95 logged ($13.20 billed). The whole-design
    check found 147 mandatory issues, the routing pass left 87, almost all
    layout spacing (LAYOUT-001, 066, 015, 031, 065, 009, 035) and 3
    DESIGN-008. Not done: zero mandatory issues; DS22 first.

- [x] **DS22** Design stage cost and layout feedback (1 h) (done 2026-10-30). Depends: DS7
  - Found in DS7's first live run ($12.95 for one idea): the strong model
    ($5.90, rounds 3 and 4 resend the whole conversation), a peer and an
    output reviewer on every nodes call (about 75 reviewer calls), layout
    rules seen only after assembly (147 issues found late, fixed in an
    expensive pass), and an IA rerun that rewrites every screen's text, so
    any wording drift sends that screen to a fresh nodes call with
    reviewers. Needs the user's choice of which to change.
  - Agreed with the user, 2026-10-30, kept until the brainstorm ends:
    1. Each nodes call runs the LAYOUT rules on its own screen in its frame,
       inside its rounds. The routing pass no longer reruns the IA.
    2. (Out of scope: listing fresh nodes calls after an IA rerun.)
    3. Nodes calls get only the output reviewer; the peer stays on the brief,
       theme and IA.
    4. First drafts at the stage's effort, every fix at medium.
    5. Reruns keep their own report and call files.
    6. Validators: public pages for roles that never sign in and for signing
       up and in (DESIGN-018), node states within the screen's, a navigation
       node has a target, a way back from not found.
    7. Every prompt audited against its rules and review guides; the missing
       cases added.
    8. The strong model writes only the first draft of the scope and the
       brief, at high effort; every other call and every fix runs on the
       normal model, fixes at medium (no strong-model fallback). The IA stays
       on the normal model at high effort. Measure the cost on the next run.
    9. One more round of validators and the output reviewer (round 4), then
       the final fix in round 5.
  - Built inside DS23, 2026-10-30: the runner has five rounds, fixes at
    medium, `draftModel` for the first draft of the scope and the brief, and
    no strong model in later rounds; a stage with no peer guide gets the
    output reviewer alone. Items 1, 3, 5 and 6 are DS23's widget checks,
    reviewers, `-fix` stages and DESIGN-018, 033, 034 and 035. The cost is
    measured on DS23's first live run.

- [x] **DS8** Renderers (45 min) (done 2026-10-30). Depends: DS7
  - `02-design/09-assemble.md` as in the spec. Optional: `02-design/09-wireframes.html` (D3.6 D).
  - Built 2026-10-30 on the reading-list fixtures ahead of DS7; the wireframes
    are DS6b's. The stage writes `02-design/09-assemble.md` once DS7 exists.
  - Done when: you can review any screen from the markdown alone.

- [ ] **DS9** Every golden idea (60 min). Depends: DS8
  - Found in DS18 (2026-10-30): the freelancer and dashboard themes both
    gave the brand fill `#6D28D9`, Tailwind's violet-700, from different
    hues and chromas; tune the theme prompt toward colors made from the
    brief, not a stock palette.
  - Run design for every golden flow set; the ecommerce store runs once untuned first, recorded; tune prompts; save golden `02-*`.
  - Done when: **G2**, including at least one justified new component for the
    dashboard editor.

- [x] **DS10** Theme defaults reach the app (30 min) (done 2026-10-30). Depends: DS4a
  - Found in DS7e's review: S1 applies colors, radius, focus ring and fonts
    but not `defaults`, and FE4 strips `size` and `look`, so the theme's
    component defaults reach nothing; and `base` resolves to the same look
    as "" for Button, IconButton, PopoverButton, Link and ChipGroup.
  - Decided (user, 2026-10-30): the defaults hold for the whole app. S1
    writes them into each recipe's `defaultVariants`; a node leaves `size`
    and `look` "" and, when it must differ, says why in `overrideReason`
    (DESIGN-027); `base` stays as written; FE4 gets `size` and `look` only on
    a node that overrides. The prompt, the reading-list fixture and its
    theme (Button `md`) and the spec follow.

- [x] **DS11** LAYOUT-010 and LAYOUT-063 fail honest output (30 min) (done 2026-10-30). Depends: DS6c
  - Found in DS7e's review: LAYOUT-010 treats a list section's top-level
    nodes as its rows, so a heading or a pagination beside the list fails it,
    and it allows only 0 or 8 between rows; LAYOUT-063 asks any dialog with a
    destructive action to be a confirmation, so an edit drawer with Delete
    fails. Changing them loosens a rule, so it waits for the user.
  - Loosened (user, 2026-10-30): LAYOUT-010 finds the repeated items and
    wants one gap, 8 to 16 between cards and 0 to 12 between rows; LAYOUT-063
    checks only a dialog whose one job is the destructive action.

- [x] **DS12** Issues go back to the call that owns the value (45 min) (done 2026-10-30). Depends: DS7e
  - Found in DS7e's review: the whole-artifact and layout rules run after
    every call has closed its rounds. A theme value, a section's box or
    layout, and a node each belong to one call, and only that call can fix
    them. Route each issue by its `at`; give `runSpecStage` seed issues for a
    `start` document, so a rerun opens with a fix round; an IA fix reruns
    the nodes of the screens it changed.
  - Decided (user, 2026-10-30): route to the owner, one pass. `route.ts` reads
    each issue's rule and `at`: a region is the theme's, a section, screen
    access, step coverage or reachability the IA's, a node or a page its
    nodes call's; DESIGN-008 and 010 go to the screens serving the step,
    DESIGN-024 and 025 to the shells. `runSpecStage` takes `seed` issues for
    a `start` document; a rerun has no reviewers.

- [x] **DS13** The nodes call sees the look it builds (20 min) (done 2026-10-30). Depends: DS7e
  - Found in DS7e's review: the nodes prompt says "" takes the theme's
    defaults and marketing pages compose visually, but the call never sees
    the defaults, its kind's `main` block, or the brief's feel, personality
    and imagery. Add them to `prompt-nodes-input.md`.
  - Decided (user, 2026-10-30): the look summary, a `look` block with the
    brief's feel, personality and imagery, the theme's defaults and the page
    kind's `main`.

- [x] **DS14** Brief hues stay apart (30 min) (done 2026-10-30). Depends: DS3
  - Found in DS7e's review: BRIEF-001 checks ranges only, so two colored
    entities 8 degrees apart, or a brand hue in the success band, pass. A
    BRIEF-003 for the distance between hues, and a warning for a hue in a
    status band unless the idea asks for it.
  - Built as BRIEF-003, 30 degrees apart; the brief prompt says so.

- [x] **DS15** Fixed-height regions fit their nodes (30 min) (done 2026-10-30). Depends: DS6b
  - Found in DS7e's review: the solver forces a region to the theme's fixed
    height without comparing its content, so a 40 tall header with md
    buttons passes. A LAYOUT rule on fixed-height regions, and a lower bound
    on `heightPx` in THEME-006.
  - Built as LAYOUT-071 (new H-71) and a THEME-006 floor: a fixed bar fits
    at least the smallest button and its padding.

- [x] **DS16** Section surfaces for visual-first pages (45 min) (done 2026-10-30). Depends: DS7e
  - Found in DS7e's review: a section has no background or tone, so a
    marketing page can only arrange rectangles. Needs the user's choice: a
    `surface` on sections checked against the theme's pairs, or tone left to
    the coding stage and the visual rubric.
  - Decided (user, 2026-10-30): `surface` on sections, page, frame, brand or
    accent, each a pair THEME-001 already checks; the IA prompt, the
    renderer, the fixture and the spec follow.

- [x] **DS17** Review leftovers (20 min) (done 2026-10-30). Depends: DS7e
  - Found in DS7e's review: FE2 still described the page frame from before
    the theme's layouts, and the theme call read the whole flows JSON for a
    frame that needs only what each flow is. FE2 now builds the frame from
    the shells; the theme call gets each flow's header.

- [x] **DS18** The theme in Storybook (1 h) (done 2026-10-30). Depends: DS3
  - Why: the theme must be seen on real components before any page is
    designed (user, 2026-10-30).
  - `weave app <runId>`: the template copied to the untracked `apps/<app
    name>` by its own generator and installed (pnpm, once per app);
    `src/agents/02design/02theme/preview/apply.ts` writes the run's theme into it (S1's apply: brand,
    page and entity colors, radius, focus ring, fonts with Storybook's
    head, and each component's own recipe defaults); one story renders
    every recipe; Storybook on port 6116, so one on 6006 is left alone,
    gives `02-design/02-theme-light.png` and `02-design/02-theme-dark.png` in the run.
  - A default whose component has no recipe of its own is not applied and
    is listed, such as IconButton's ghost look, which lives in Button's.

- [ ] **DS23** Widgets: the IA plans, widgets are defined, laid out per screen and built once, code assembles (1 day). Depends: DS7, DS22
  - Why: the first live design run (DS7) cost $12.95 for one idea and left 87
    issues found late; the IA wrote structure for every screen and was
    rerun, the nodes calls redid shared parts per screen, and copy drifted
    between screens (user, 2026-10-30, after a brainstorm).
  - Revised 2026-10-31 (user, after a second brainstorm): the IA did too
    much in one call (screens, widgets, copy and layout), and it cannot
    place widgets side by side without knowing what fits. The IA now makes
    the product decisions; widget definitions, layout and building are
    separate calls, and code assembles.
  - Every call runs D1.12's five rounds. The effort is the first draft's;
    every fix runs at medium and 0.2. The calls, in order:
    1. IA (high, draft at 0.7, peer and output reviewers): the screens with
       their routes, access, entry and navigation (an item's label is its
       page's title); the steps and states each screen serves; each screen's
       blocks in reading order, with a purpose and the steps each serves, and
       on a marketing page the composition it intends, such as "a
       full-width band holding three features"; and the new components it
       declares (name, purpose, closest design-system components, why not).
       Its rules: every step and alternative on a screen, access both ways,
       entry pages and dialog parents, at most 8 blocks on a page, and the
       components' reasons, names and budget.
    2. Widgets (medium, 0.2, output reviewer): one call for the whole app.
       It turns blocks into widget definitions, and a block repeated across
       screens becomes one widget. It writes the copy deck, every visible
       string once with an id, and each widget's steps, fields, data,
       states, heading level, width range (a minimum, and a maximum or fill),
       height (fill or free) and slots. A slot is a box inside a container
       widget that holds child widgets; anything with a background, such as
       a band, is a widget. Its rules: every block becomes exactly one
       widget, the copy deck rules, each screen's steps, fields and states
       given to its widgets, and one level-1 widget per page with no
       skipped levels.
    3. Layout (medium, 0.2, output reviewer): one call per screen, in
       parallel. It writes the screen's box tree: boxes as a flat list with
       a parent and an order; each box a direction, a size along its
       parent's direction (content, fill with a share, or a fixed width) and
       an align (start, where content follows, by default; stretch for a row
       of cards); each widget placed by its box and index, with child boxes
       and widgets sharing one order. The gap between boxes and widgets is
       the theme's section gap, and 20 in a dialog, so the call picks no
       spacing. Its rules: at most three levels of boxes, at most one fill
       among the boxes stacked in a column unless they split by share, a
       fill height only under a parent of bounded height, each row's widget
       minimums and gaps within its width (the content width from the
       theme's layout, in exact numbers), the reading order of the IA's
       blocks, and every widget of the screen placed once.
    4. Components (medium, draft at 0.7, output reviewer): one call per
       declared component. It designs the component in full (box, parts,
       layout and behavior prose, props, states, keys, ARIA) to fit the
       narrowest widget that holds it. It sees the design system's
       component names with one line each, and the spacing, radius, type
       and color scales, not the full design-system description.
    5. Widget builds (medium, 0.2, output reviewer): three widgets per call,
       with a 32k output budget. Each writes nodes with copy ids, picks the
       design-system components, and records the widget's edge and root
       layout. A container widget places its slots among its own nodes and
       never builds the children; a fill widget designs its own scroll
       region. Inside the call: the node rules on the widget alone, its
       steps and fields, exactly its states, its heading level, navigation
       with a target, and the LAYOUT rules solved at the widget's minimum
       and maximum width.
    6. Frames (medium, 0.2, output reviewer): one call per used shell fills
       its header, sidebar and footer, as before (user, 2026-10-31: keep).
  - Assembly (code, no model): each screen from its box tree. Every child
    gets its minimum width and the rest goes by share up to each maximum; a
    row that cannot fit its minimums stacks. Heights follow content, and the
    parent resolves fill and free: a fill widget in a free box grows with
    its content, a free widget in a fill box makes the box scroll, and a
    fill widget in a fill box scrolls its own body. Ids, copy and heading
    sizes work as before. The whole-design and layout rules then run; an
    issue inside a widget goes back once to its build call and an issue in
    a screen's boxes to its layout call, each as a separately named fix; the
    rest are known issues.
  - The tree of page boxes, widgets, nodes, slots and child widgets is what
    the coding stage writes its flex layout from. It is desktop only; the
    coding stage stacks rows below 640px on phones.
  - Folded in from DS22: fixes at medium effort; the strong model only for
    the first draft of the scope and the brief, no fallback; five rounds,
    the output reviewer again in round 4; reruns keep their own records;
    the prompts audited against their rules and review guides.
  - Built 2026-10-30, the first version, with a fake model:
    `schema-widgets.ts`, `assemble.ts` and `widget-nodes.ts`,
    `validate-widgets.ts`, `route.ts`, `prompt-screens.ts` with
    `prompt-ia.md`, `prompt-component.md`, `prompt-widgets.md`,
    `prompt-frame.md` and the shared `prompt-nodes.md`, and the rewritten
    `stage-screens.ts`. New rules DESIGN-028 to 035; DESIGN-018 both ways;
    DESIGN-004 split between the IA and the component call. The
    reading-list widget design is derived from its screens fixture
    (`__fixtures__/widgets.ts`) and assembles back with every design and
    layout rule passing. The revision replaces the IA's schema, prompt and
    rules, `arrangement` and `area`, the fixed 300 side panel and the page
    layouts code made; the widget builds, the frame and component calls,
    the copy deck, the stitching and the routing stay.
  - Decided while building, still holding: heading levels are real levels;
    a widget keeps one, now on its definition (DESIGN-030), so its build can
    size the text under a heading (LAYOUT-031), and code sets a heading's
    type size from its level. A record's value is a node's `sample`, and
    copy may hold `{Noun.attribute}` slots. A frame's link to a navigation
    item says the item's label. A widget's own layout check keeps LAYOUT-070
    for the first widget of a page only.
  - Effort and temperature, decided 2026-10-31: high only for the scope, the
    brief and the IA, the decisions made once for the app; the IA's first
    draft at 0.7 now that it carries the product decisions and not the
    mechanical rules; component designs at medium, reversing 2026-10-30's
    high (user).
  - Not done: the revision, after the folder restructure the user is
    proposing (2026-10-31); then the first live run, freelancer workspace
    from the brief, which also measures what fixes cost with three widgets
    per call.

- [ ] **DS24** A frame can serve a step (30 min). Depends: DS23
  - Found building DS23: the IA gives steps to widgets only, so a sign out
    or an account link drawn in the app frame cannot be the control that
    serves its step, and the IA has to put one in a widget too. Give the IA
    the steps each layout's frame serves, and the frame call DESIGN-032.

- [ ] **DS25** Route what the IA plans but widgets draw (30 min). Depends: DS23
  - Found building DS23: a page or dialog no control opens (DESIGN-017) is
    recorded as known after assembly, though the widget whose `content`
    names its opener could fix it. Route it to the widgets on the parent page
    that name the screen.

- [x] **DS20** Base colors per project (45 min) (done 2026-10-30). Depends: DS18
  - Why: most components wear the base set (secondary buttons, inputs,
    cards, tables, menus), so an app that keeps the template's greys looks
    like every other (user, 2026-10-30).
  - The brief picks `baseHue` and `baseChroma` (neutral, muted or balanced,
    never vivid); the theme call writes the base set's twelve roles in each
    mode; THEME-001 and 002 check it like the brand set, on the page and the
    frame too; `src/agents/02design/02theme/preview/apply.ts` writes it into `colors.base`; THEME-003
    keeps only status, divider, backdrop and skeleton fixed.
  - The theme prompt says what base is for, and to make every value from
    the brief's hues, never a stock palette (DS9's `#6D28D9` finding); the
    theme reviewers look for both.

- [x] **DS21** Divider, backdrop and skeleton from the theme (20 min) (done 2026-10-30). Depends: DS20
  - Why: they follow no hue of the brief, but a template grey stops showing
    on a tinted page (user, 2026-10-30).
  - The theme call writes them with the page colors in each mode; THEME-009
    wants the divider and skeleton at least 1.1:1 on the page and the frame,
    the skeleton also on the base set's bg, and the backdrop darker than
    both. THEME-003 keeps only the status sets fixed.

- [ ] **DS19** Neutral variant defaults (20 min). Depends: DS18
  - Found in DS18's screenshots: the dashboard and store themes set Button,
    Card, Checkbox, Tabs and other defaults to the `base` variant, so
    selections and checks turn neutral black instead of the brand color.
    THEME-008 lets the theme pick `base`. Needs the user's choice: keep it a
    free choice, or hold `variant` at the recipe's own default.

- [x] **F14** One retry when an answer is cut (20 min) (done 2026-10-30). Depends: F13
  - Why: the ecommerce catalog was cut at 65k output tokens on 2026-10-30
    and the run ended (user, 2026-10-30).
  - A stage-round call cut at the output limit, after the client's own
    doubling, is logged and asked once more with the same input; a second
    cut fails the stage as before. The retry wraps the call, so a fix's
    messages are never pushed twice.
  - Each cut answer is kept as `llm/<stage>-r<round>-cut.json` (a second in
    the round as `-cut-2`), so a runaway can be read (user, 2026-10-30).

## Phase 4: Contracts (Fri Oct 30, morning)

Spec: [specs/contracts.md](specs/contracts.md). Decisions: D4.1 to D4.6. Steps 24 to 29.


- [x] **F15** Folder structure: agents by stage group (2 h) (done 2026-10-31). Depends: DS23 first version
  - Why: the generator's file names had become hard to follow, with one
    folder holding the brief, theme, IA, widgets, layout and assembly (user,
    2026-10-31). The user gave the layout.
  - `src/agents/<NN><group>/<NN><stage>/`: each stage a folder with
    `stage.ts`, `schema.ts`, `render.ts`, `prompts/` and `validation/`, and a
    full pipeline stage named `<group>-<stage>` (`flows-scope`,
    `design-architect`). The single `design` stage became `design-architect`,
    `design-invent`, `design-draw`, `design-frame` and `design-assemble`, each
    with its own artifact; assembly fixes through the draw and frame stages.
    `src/runner/` holds running one stage. Artifacts live in
    `<NN>-<group>/<NN>-<stage>.json` in a run, and the golden fixtures moved
    to match, their data unchanged. AGENTS.md has the map.
  - Runs made before this keep the old names and cannot be resumed.
- [x] **C1** Conventions and schema (40 min) (done 2026-10-30). Depends: FL1
  - `src/agents/03contract/conventions.ts` (the conventions table as data and
    functions: `pathFor(operation)`, `statusFor(code)`, built-in `User`) and `schema.ts`.
  - Done when: the schema passes `toJsonSchema`; unit tests for `pathFor` and `statusFor`.

- [x] **C2** Compile (60 min) (done 2026-10-30). Depends: C1
  - `compile.ts`: per entity `createInput`, `updateInput`, `view`; per list operation `query`, `page`.
  - Done when: tests show sensitive fields missing from views, server fields
    missing from inputs, update inputs all optional.

- [x] **C3** Validators (90 min) (done 2026-10-30). Depends: C2
  - CONTRACT-001 to 019 with fixtures (a hand-written reading-list contract and mutations).
  - Done when: each rule has a passing and a failing test.

- [ ] **C4** Prompt and stage, in parallel with design (40 min). Depends: C3, DS7
  - `prompt.ts` fills `src/agents/03contract/prompts/prompt.md` (draft provided);
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
  - `src/agents/04reconcile/matrix.ts`: `buildMatrix`, data resolution as in the spec.
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

- [ ] **S1** Scaffold and theme apply (90 min). Depends: R6, DS4, DS4a
  - `src/agents/02design/02theme/preview/scaffold.ts`: copy `template/` to `runs/<id>/app` with
    `generate.mjs`, install, build the MCP. `src/agents/02design/02theme/preview/apply.ts`: apply
    `02-design/02-theme.json` with `ts-morph` to `colors.ts` (primary and entity sets,
    and the four page colors; a light-only or dark-only app pins its mode),
    `tokens.ts` (radius, focus ring), `packages/styles/src/fonts.ts`
    (the theme's three families, mono included: the brief picks it since
    2026-10-30, so not a fixed JetBrains Mono), and each recipe's
    `defaultVariants` from the theme's `defaults`, a look such as
    `rounded ghost` as its flags (DS10);
    THEME-003 checks the status sets are untouched (base, divider, backdrop
    and skeleton are the theme's since DS20 and DS21).
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
  - `src/codegen/pages.ts`: the page frame from `02-design/09-assemble.json`'s shells,
    one per kind: their regions docked as the layout says and filled from the
    shell nodes, the navigation among them, shared by every framed page of
    the kind. For every page screen a route folder with a `page.tsx` in its
    kind's frame (H1, sections with their node manifests as comments,
    `data-testid` per node), dialogs and drawers as files beside their page,
    a sign-in guard for `signedIn` screens.
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
  - Nodes reach the session and the shell's manifests without `component`,
    which serves validation only; the session picks the component from
    `what` through the MCP (design spec, 2026-10-30). `size` and `look` come
    only on a node that overrides the theme's defaults, with its
    `overrideReason`; the recipes already carry the defaults (S1, DS10).
  - Done when: every freelancer-workspace route passes validate, typecheck, lint
    and verify, and the core loop works by hand.

- [ ] **FE5** Rendered checks (90 min). Depends: FE2
  - `src/checks/`: DESIGN-R-001 to 009 with Playwright (axe, contrast, keyboard
    walk, target size, overflow, first viewport, type size, color variables,
    proximity), written as reusable collectors the benchmark reuses.
  - Done when: each rule has a test on a fixture page; the freelancer workspace's
    routes pass the mandatory rules.
  > Blocked: needs a model run, waiting for the user's go. The collectors,
  > `runRenderedChecks` and their tests on fixture pages are in (2026-10-30);
  > the frontend stage and `resolveRouteSamples` come once an app exists.

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
  - `src/agents/tests/`: one `@playwright/test` spec per flow in `web/e2e/`,
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
