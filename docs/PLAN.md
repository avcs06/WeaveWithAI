# Plan

Start: Wed 2026-10-28, 15:30 IST. Submit by Wed 2026-11-04 evening IST (the
portal closes Thu 2026-11-05, 07:30 IST). About 8 to 10 hours a day.

**Pivot, 2026-10-28 evening.** The backend and deployment agents are parked.
Everything after the spec stages goes into the frontend: the contract becomes
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
| G4   | Oct 30, night | Dropped 2026-11-01 with reconciliation (Phase 5)                                               |
| G5   | Oct 31        | Freelancer workspace scaffolded with its theme, its `.weave/` folders and its entity layer from the contract; the app builds |
| G6   | Nov 1         | Dashboard editor and freelancer workspace built by the code stages: every route passes its checks or records its known issues; every flow works by hand |
| G7   | Nov 2         | Benchmark table generated for the freelancer workspace; e2e tests generated from the flows pass after bounded repairs |
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

- [x] **F16** Fixes return patches (60 min) (done 2026-10-31). Depends: F13, FL9. Decision D1.5 C
  - Why: a fix that rewrites a whole long output brings back errors in parts
    that were fine, and pays for the whole output again (user, 2026-10-31,
    design brainstorm DR07). The flows patch already works this way, for
    flows alone.
  - First drafts stay whole. Every fix asks for a patch: the items that
    changed and the new ones, each complete, and the ids of the items to
    remove. A stage names its keyed arrays (the array and the key of its
    items); the runner builds the patch schema from the stage's schema and
    merges the patch into the current document. Validators and reviewers
    see the merged document. A stage with no keyed arrays, such as the
    brief, keeps whole fixes.
  - `prompt-fix.md` asks for the patch. The flows reconcile stage's
    `applyPatch` becomes the runner's merger, so a patch can remove fields,
    forms and subflows too, not only flows.
  - Done when: runner tests show a patch replacing an item by id, adding one
    and removing one, and the merged document validated and reviewed; the
    flows reconcile tests pass on the runner's merger; `pnpm typecheck`;
    `pnpm test`.
  - Built 2026-10-31: `src/runner/patch.ts` (`patchSchema`, `applyPatch`
    and the shared patch format), a `patchKeys` option on `runSpecStage`,
    `prompt-fix.md` for patches and `prompt-fix-whole.md` for whole fixes.
    The flows reconciliation is the first stage with keys; DS23 names them
    for the design chain.

- [x] **F17** ARCHITECTURE and D1.12 follow F15 and DS22 (20 min) (done 2026-10-31). Depends: F15
  - Found while applying the design brainstorm (2026-10-31): ARCHITECTURE's
    code layout still lists `src/stages`, `src/config` and
    `src/core/runSpecStage.ts`, and both it and OPTIONS D1.12 say four
    rounds, where the runner runs five since DS22.
  - Built 2026-10-31: the code layout follows `src/`, with the modules not
    built yet marked planned; the schedule, the review rounds and D1.12's
    notes say five rounds.

- [x] **F18** A run's live log as a tree (30 min) (done 2026-10-31). Depends: F15
  - Why: the user, 2026-10-31. The console showed only each stage's start
    and end, so a long stage gave no sign of its rounds.
  - Built: `src/core/log.ts` prints each group, each stage under it, and
    each part's lines under the stage, every line named by its part, such as
    `expand-2 round 2 review peer found 1 blocker (stats)`. A header repeats
    when the next line belongs to another stage, since stages and parts run
    side by side. The runner adds three events: `round:start`,
    `round:validated` with the failed rule ids, and `review:start`. A
    reviewer's `llm:call` carries its reviewer and blocker count.

- [ ] **F19** `weave golden` counts the calls of side-by-side stages (15 min). Depends: DS32
  - Why: it sums a stage's calls up to the next stage that starts, so
    screen, invent, draw and frame, which start together, show 0 calls and
    $0; the 2026-11-01 golden table summed them from the events by hand.

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

- [x] **FL14** Flows that run signed out (45 min) (done 2026-10-31). Depends: FL13
  - Why: DESIGN-018 counts a flow as signed in when its role signs in, so the
    landing flow, which belongs to the role it invites in, makes the landing
    page, sign up and sign in signedIn. Only its free-text precondition ("Not
    signed in.") says otherwise, and code never reads a model's free text
    (user, 2026-10-31, design brainstorm DR27).
  - Each flow gets `signedOut`: true when the user is not signed in during
    the flow, as on the landing page, while signing up or signing in, and in
    every flow of a role that never signs in. The flows catalog writes it
    with the other header fields, and `prompts/flows.md` explains it.
  - FLOW-025 (mandatory): signUp and signIn flows and every flow of a role
    that never signs in are signedOut; a signOut flow is not.
  - DESIGN-018 reads `signedOut` in place of the role and the auth kind, and
    the architect's processing step fills a screen's access from it (DS23).
  - The reading-list fixture gets the field. The golden flow sets get it on
    every flow, set by hand from their preconditions and auth kind; AGENTS.md
    keeps golden files unchanged, so this needs the user's go.
  - Done when: FLOW-025 has a passing and a failing test; a DESIGN-018 test
    keeps a landing page that serves a signed-out flow of a signed-in role
    public; the golden flows parse; `pnpm typecheck`; `pnpm test`.
  - Built 2026-10-31: the golden sets mark the landing flows, sign up, sign
    in and the booker's flows signed out (user's go); their hashes are
    recomputed so the reconciled flows stay current against their catalog.
    The IA prompt's access line reads `signedOut` until DS23 rewrites it.

- [x] **FL15** A field's example is quoted text (10 min) (done 2026-10-31). Depends: FL14
  - Why: the freelancer catalog was cut twice at the output limit on
    2026-10-31 ($0.87), each answer stopping at a field's `"example":` and
    writing about 59k spaces. The example is a string, so a number the
    model wants to write there is never allowed, and spaces are.
  - The schema and the flows prompt say the example is text in quotes, even
    for a number, a date or a yes or no.

- [x] **FL16** One goal a flow, one action a step (20 min) (done 2026-10-31). Depends: FL15
  - Why: the dashboard run of 2026-10-31 20:15 made 10 flows where the
    golden has 17. Each of three flows copied one scope item that named
    several actions ("Rename, duplicate and delete a dashboard"), and
    nothing checked it. Five dashboard runs gave 10 to 17 flows with the
    same catalog prompt. The landing step "chooses to sign up or sign in"
    made DESIGN-028 fail 21 times downstream.
  - The flows prompt says an item with several actions often needs a flow
    for each, that an action taken on its own is its own flow, and that a
    step is one action. The catalog peer review blocks bundled goals, and
    the expand output review blocks a step with two actions. No validator:
    the golden's F16 creates, updates and deletes ChecklistItem in one flow,
    and word matching belongs to the reviewers (FL11).

- [x] **FL17** Up to 20 flows, 12 steps a flow (5 min) (done 2026-11-01). Depends: FL16
  - Why: the user set the caps (2026-11-01): 20 flows, from 24 in code and
    15 in the spec, and 12 steps a flow, from 16 in code. FLOW-020, the
    flows prompt and the spec's row agree. Every golden set fits: at most
    17 flows and 7 steps.

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

- [x] **DS7** IA and nodes stage (90 min) (folded into DS23, 2026-10-31). Depends: DS3, DS4, DS6, DS4a, DS12, DS13
  - Folded into DS23 (2026-10-31): the chain replaces the IA and nodes
    calls, and DS23's done-when carries this one's, the freelancer
    workspace with zero mandatory issues. The notes below are history.
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

- [ ] **DS9** Every golden idea (60 min). Depends: DS8, DS23, DS26, DS27
  - Found in DS18 (2026-10-30): the freelancer and dashboard themes both
    gave the brand fill `#6D28D9`, Tailwind's violet-700, from different
    hues and chromas. DS27 builds the colors from the brief's hues.
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

- [x] **DS26** Brief: a hue table and font candidates (30 min) (done 2026-10-31). Depends: DS3, DS14
  - Why: a model reads hues as HSL and color names, and picks the same few
    fonts from lists sorted most popular first (user, 2026-10-31, design
    brainstorm DR01 and DR02).
  - The brief prompt carries a table of 12 named hues with their OKLCH
    degrees, red to pink. Code fills it with culori from one reference color
    per name, so the numbers are exact.
  - `fonts` becomes three candidates per role (ui, display, mono), best
    first, each with a reason; the first of each role is the one used.
    BRIEF-005 (mandatory): each role lists three different families.
  - Done when: a prompt test shows the hue table; BRIEF-005 has a passing and
    a failing test; the theme, the renderer and the apply step use the first
    candidate; `pnpm typecheck`; `pnpm test`.
  - Built 2026-10-31: the table names red, orange, amber, yellow, green,
    mint, teal, sky, blue, violet, magenta and pink; `chosenFonts` gives the
    theme the first candidate of each role, so the theme, the renderer and
    the apply step read the theme's fonts as before.

- [x] **DS27** Theme colors from computed ramps (2 h) (done 2026-10-31). Depends: DS4a, DS20, DS21
  - Why: the theme call cannot work out contrast and falls back to palettes
    it knows: two themes from different hues gave the same `#6D28D9`,
    Tailwind's violet-700 (DS9). The model keeps choosing every value (D3.3
    E), now from ramps code computes (user, 2026-10-31, design brainstorm
    DR03).
  - Code builds a 12-step OKLCH ramp, in each mode, for each hue and chroma
    the brief names: the brand, the base set, the page, the frame and each
    colored entity. The prompt shows each step's lightness and its contrast
    on white and on black, so the call can choose pairs that pass.
  - The theme call assigns each color role to a step of its set's ramp, in
    each mode; `divider`, `skeleton` and `backdrop` take steps from the page
    or the base ramp. `buildTheme` turns the steps into hex, so the theme
    artifact keeps its shape and THEME-001, 002, 005 and 009 run as before.
  - The theme prompt, its review guides, the reading-list theme fixture and
    the spec's Theme section follow.
  - Done when: for 12 hues times 3 chromas, every ramp keeps its hue and two
    hues never share a step (test); the theme schema passes `toJsonSchema`
    within Meta's limits; `pnpm typecheck`; `pnpm test`.
  - Built 2026-10-31: `ramps.ts` (Radix-like lightness per step, chroma by
    the brief's level, a share per step); the reading-list theme picks the
    usual steps (backgrounds 2 and 3, borders 8, fills 9 and 10, text 12 and
    11, accent text 1) and passes every THEME rule. The theme's seeded rerun
    went: no stage routed issues to it any more.

- [x] **DS28** Heights only where exact (1 h) (done 2026-10-31). Depends: DS6c
  - Why: rules failed on text heights the solver estimates, which no model
    can change (user, 2026-10-31, design brainstorm DR17). Spacing stays as
    built: spacing by relation (DR16) was dropped the same day because it
    adds scope (user).
  - A rule reads a height only where it is exact: a design-system component,
    a fixed box, an icon, an image, or single-line text that ends in an
    ellipsis. Multi-line text is content height. The rules read the
    skeleton solved with each multi-line text at one line, its minimum; the
    wireframes draw it at a feasible height, two to four lines picked from
    its id, for the picture only (user, 2026-10-31).
    - LAYOUT-028 fails only when the page is too tall even at the minimum.
    - LAYOUT-010 checks structure instead of heights: the repeated items are
      one item repeated, stretched to one height on each line, with one gap.
    - LAYOUT-071: text in a fixed-height region is single-line with an
      ellipsis.
  - The heuristics catalog (H-10, H-28, H-71), the node guide, the
    reading-list fixtures and the spec follow.
  - Done when: each changed rule has a passing and a failing test; the
    wireframes draw a fixture's multi-line text at the same height on every
    run; the reading-list screens pass every rule; `pnpm typecheck`;
    `pnpm test`.
  - Built 2026-10-31: the solver takes a text mode (`minimum` for the
    rules, `picture` for the wireframes and the CLI); one-line text is a
    Truncate, so the reading-list wordmarks in the fixed headers became
    Truncates; the node guide asks for stretched cards and Truncate.

- [ ] **DS23** Design chain: architect, catalog, screen, invent, draw, frame, assemble (1 day). Depends: DS22, F16, FL14, DS28
  - Why: the first live design run (DS7) cost $12.95 for one idea and left 87
    issues found late; the IA wrote structure for every screen, the nodes
    calls redid shared parts per screen, and copy drifted between screens
    (user, 2026-10-30). Two brainstorms on 2026-10-31 (user) split the work
    by what a model does well: the creative calls decide, the labor calls
    define and place, and code works out everything that follows from them.
    Brainstorm ids are in brackets.
  - Every model call runs D1.12's five rounds; fixes run at medium and 0.2
    and return patches (F16). Each stage is a folder in
    `src/agents/02design/` and a pipeline stage `design-<name>`. In order:
    1. Architect (`03architect`; high, draft at 0.7; peer and output
       reviewers). The creative call. It plans no blocks and no layout. It
       writes:
       - the screens, with their routes, entry pages, dialog parents, page
         titles and the steps each serves;
       - the navigation, fitted to the theme's page layouts; an item's label
         is its page's title [DR25];
       - for a screen whose frame differs from its layout's default, how it
         differs, in prose [DR26];
       - each screen's composition as prose, which catalog and screen follow
         and the peer reviewer judges [DR06];
       - the new components: name, purpose, the closest design-system
         components and why not, and a description of each component's
         content, purpose, emphasis, feel and look, in the theme's terms
         (color set, radius, font, density) with one reference [DR30].
       Its processing step fills each screen's access and roles from its
       steps' flows (FL14) and its required states from what the steps do:
       listing records needs empty and error; loading, a field's error and a
       form's result are the design system's or a toast. It puts each alternative on its step's
       screen. The architect adds only a state beyond these, or an
       alternative shown on another screen [DR05].
       Its rules: every step and alternative on a screen; entry pages and
       dialog parents; every navigation item in a slot of its layout; a
       route for each page; the components' reasons and names. The budget is
       checked at assembly, where the components are placed.
    2. Catalog (`04catalog`; medium, 0.2; output reviewer). One call for the
       whole app. It sees every screen, so a widget that screens share is
       defined once [DR10, DR20]. It writes:
       - each widget's definition: an id, a kind, what it holds, the steps it
         serves, the data it shows (Noun.attribute), `containsHeading`, and
         its slots, each with a name, what goes in and a width range;
       - each widget's coarse layout: its parts in rows and columns, each
         part's minimum width from the table of possible boxes, and ellipsis
         or wrap on each text part [DR11, DR13];
       - a width range for each new component;
       - the widgets and components each screen is made of, and which of
         its steps its frame serves, such as sign out [DR26].
       No implementation and no heights: heights follow content.
       Its processing step fills each widget's fields and required states
       from its steps [DR08], and adds up its minimum width from the coarse
       layout [DR13].
       Its rules: each screen's steps served by its widgets and components or
       by its frame; every widget and component used; each extra state of a
       screen held by one of its widgets; data names vocabulary nouns; every
       minimum fits the content width; every slot fits inside its widget.
    3. Screen (`05screen`; medium, 0.2; output reviewer). One call per page
       with the dialogs and drawers it opens, in parallel [DR20]. It writes
       the box tree and the instances. An instance places a widget or a
       component into a box or into another instance's slot [DR21], with:
       - a position id;
       - fill or free for its height [DR14];
       - a heading level, when its widget contains a heading [DR12];
       - the words for its slots, such as a title and a description, in the
         brief's voice [DR28, DR09].
       The level-1 instance shows the page's title. The output reviewer
       compares the box tree with the screen's composition prose [DR29].
       Its rules: at most three levels of boxes; each row's minimum widths
       and gaps fit its width [DR13]; every widget and component of the
       screen placed; every slot fill within its slot's range; one level 1
       per page and no skipped levels; a fill instance in a free page
       section is a warning [DR14].
    4. Invent (`06invent`; medium, draft at 0.7; peer and output reviewers).
       One call per new component. The creative expansion: it turns the
       architect's description into layout and nodes inside the component's
       width range, creative within that description, which its peer
       reviewer checks [DR24]. A visual no node can express, such as a ring
       or a timeline bar, is a `shape` node: `what` prose and a box
       [DR23]. Look only: behavior, props, keyboard and ARIA belong to the
       coding stage.
    5. Draw (`07draw`; medium, 0.2; output reviewer). One widget per call,
       to measure its cost (three until the first live run, user 2026-10-31).
       It expands each definition into layout and nodes: design-system
       components, new components inside their width range, text and lists
       [DR21]. The widget's heading takes its level from the instance, and
       the text right under it is sized relative to it [DR12]. A widget is
       layout and nodes only: words that differ by instance are slots
       [DR28]. It writes its fixed text inline [DR09].
    6. Frame (`08frame`; medium, 0.2; output reviewer). One call per used
       shell. It expands the theme's frame into layout and nodes, draws the
       navigation and each screen's frame changes, and serves the steps
       catalog gave the frame, which count on every page that uses it
       [DR26].
    Screen, invent, draw and frame read only what the architect and catalog
    wrote, so they run in parallel, three calls at a time (`PARALLEL`).
  - Assemble (`09assemble`; code, no model). It builds each screen from its
    box tree and instances, the widgets' and components' nodes and its
    frame; sets each heading's size from its instance's level; and builds
    the copy deck from every text and slot, with ids by code, flagging one
    step shown with two wordings [DR09]. Then the whole-design and LAYOUT
    rules run. An issue inside a widget or a frame goes back once through
    its draw or frame stage; an architect mistake found here is a known
    issue, left to the coding agent [DR19].
  - Rules that change, each in the spec's table: DESIGN-004 drops keys and
    ARIA; DESIGN-018 is dropped, as processing sets access (user, 2026-10-31); DESIGN-028 checks the deck
    code builds; DESIGN-029 checks the catalog's screen lists and the
    screen's instances; DESIGN-030 checks heading levels per instance, and a
    widget no longer keeps one level [DR12]; DESIGN-031 checks only the
    extra states; DESIGN-032 also checks a frame's steps. New: DESIGN-036
    (a navigation item's slot), 037 (box depth and rows), 038 (slot fills),
    039 (a fill instance in a free page section, warning), 040 (each
    screen's steps served), 041 (widths fit), 042 (a shape node's box), 043
    (routes and dialog size) and 044 (slots and components drawn).
  - The tree of page boxes, instances, widgets, nodes and slots is what the
    coding stage writes its flex layout from. It is desktop only; the coding
    stage stacks rows below 640px on phones.
  - Folded in from DS22: fixes at medium effort; the strong model only for
    the first draft of the scope and the brief, no fallback; five rounds,
    the output reviewer again in round 4; reruns keep their own records;
    the prompts audited against their rules and review guides.
  - Built 2026-10-30, the first version, with a fake model: the widget
    schemas, assembly, the widget page checks, routing, the IA, component,
    widget and frame prompts with the shared node guide, and the stage.
    New rules DESIGN-028 to 035; DESIGN-018 both ways; DESIGN-004 split
    between the IA and the component call. F15 moved it into the stage
    folders.
  - Decided while building, still holding: code sets a heading's type size
    from its level. A record's value is a node's `sample`, and copy may hold
    `{Noun.attribute}` slots. A frame's link to a navigation item says the
    item's label. LAYOUT-070 runs at assembly, not in a widget's own check:
    draw runs beside screen, so it cannot know which widget comes first on a
    page.
  - Effort and temperature, decided 2026-10-31: high only for the scope, the
    brief and the architect, the decisions made once for the app; the
    architect's first draft at 0.7 now that it carries the product decisions
    and not the mechanical rules; component designs at medium, reversing
    2026-10-30's high (user).
  - Done when: each stage's rules have a passing and a failing fixture; the
    reading-list design passes every rule through the whole chain with a
    fake model; `pnpm typecheck`; `pnpm test`. Then, with the user's go, the
    first live run, freelancer workspace from the brief, ends with zero
    mandatory issues (DS7's done-when) and records what fixes cost.
  - Built 2026-10-31, with a fake model: all seven stages, their processing
    steps, prompts, review guides, rules and tests. `__fixtures__/chain.ts`
    derives every call's answer from `reading-list.screens.json`, and the
    chain assembles it back with every design and layout rule passing. That
    fixture now models the chain: S04's search, table and empty state are
    one Books widget and S05's actions sit in its form, because a widget
    serving a step shows all the step's states and takes all its fields
    (DR08); one wording per step and the nav label as the page title
    (DESIGN-028, now registered); S02, S03 and S06 lay out in boxes. Found
    and fixed while building: a subflow's step gave its screen no flow, so
    the delete dialog came out public; the catalog's patch schema was nine
    levels deep, over the API's eight, so a part now names its `row`; a
    component alone was checked as a padded section, and a widget alone
    declared no components; DESIGN-001 refused a component's own node ids;
    a component placed on its own had its nodes copied into the screen.
    The reconcile pass and a bug review (2026-10-31) added DESIGN-043 and
    044 and checks to 001, 036, 038, 040 and 041, and fixed DESIGN-030 for
    dialogs, a component's padding counted twice, frame change nodes counted
    on every page, and a held component's kind and width. Decided then
    (user): DESIGN-018 is dropped; saving fields requires success unless the
    submit opens another screen; DESIGN-009 leaves impossible steps to the
    reconcile stage.
    Left: the first live run, on the user's go.

- [x] **DS24** A frame can serve a step (30 min) (folded into DS23, 2026-10-31). Depends: DS23
  - Found building DS23: the IA gave steps to widgets only, so a sign out or
    an account link drawn in the app frame could not be the control that
    serves its step. Folded into DS23 (user, 2026-10-31, DR26): catalog
    gives the frame the steps it serves, the architect says per screen in
    prose how the frame differs from its default, and frame draws and
    serves both.

- [ ] **DS25** Route what the architect plans but widgets draw (30 min). Depends: DS23
  - Found building DS23: a page or dialog no control opens (DESIGN-017) is
    recorded as known after assembly, though the widget that should hold
    its opener could fix it. Route it to the draw call of the widgets on the
    parent page whose `holds` names the screen.

- [ ] **DS30** LAYOUT-013 and a column spread apart (15 min). Depends: DS23
  - Found building DS23: TitleCover sets its title at the top and its author
    at the bottom with justify between, on purpose; LAYOUT-013 reads them as
    paragraphs 132 apart and warns. Needs the user's call: skip a column
    whose justify is between, or keep the warning.

- [x] **DS31** LAYOUT-035 on a widget's empty state (30 min) (done 2026-10-31). Depends: DS23
  - Found building DS23: a list widget now holds its own empty state (DR08),
    so chain output has no empty-state section and LAYOUT-035 checks
    nothing. Check the nodes a section shows only when empty instead.
  - Built 2026-10-31: the rule reads the nodes a section shows only when
    empty, or every node of an empty-state section, and finds what centres
    them: the one box holding them, or the box they sit in.

- [x] **DS32** Run screen, invent, draw and frame side by side (45 min) (done 2026-10-31). Depends: DS23
  - Found building DS23: the plan runs them in parallel after the catalog,
    but the CLI runs pipeline stages one after another, so each waits for
    the one before.
  - Built 2026-10-31: `SIDE_BY_SIDE` in the stage registry names the group
    and `stageBatches` cuts the pipeline into batches; `weave run` starts a
    batch's due stages together and lets all of them finish before a
    failure ends the run. Each keeps its own three calls at a time, so up to
    twelve run at once.

- [ ] **DS34** Fixes from the first live chain run (2 h). Depends: DS23, DS32
  - Why: the freelancer run of 2026-10-31 reached draw with 22 steps on two
    or more screens, widgets shared across screens with different steps, a
    hero given three actions, a page title no widget could show, time chips
    forced 160 wide, and a patch fix that emptied three widgets. Stopped at
    draw (user); flows, brief, theme and architect kept.
  - Built 2026-10-31: DESIGN-045 (a step that saves fields is on one
    screen) and the architect's line on where a step goes; the catalog's
    DESIGN-030 check and line on a page title's widget; LAYOUT-026 treats a
    Chip as a control; LAYOUT-035 reads list, table and cards sections and
    empty-state sections only; draw one widget a call, six calls at a time.
  - Then, decided by the user the same day:
    - DESIGN-046: a widget on several screens serves only shared steps; a
      part that differs is a small widget per screen in a parts slot.
    - DESIGN-047 and the architect's line: each page that deletes has its
      own confirm dialog.
    - A draw call answers one widget, and its fix patches nodes; a patch
      keeps a list an update sends empty, and the patch prompt says lists
      inside an item come in full.
    - Strict decoding for every call, after a probe of all 20 schemas
      ($0.06); an answer the schema refuses is kept, never cached, and asked
      once more.
    - The catalog's hero line, and the draw reviewer's line that a hero
      leaving out a third action is no blocker.
    - A Card in a CardGroup is an option of a field (LAYOUT-038 and 039),
      and the node guide says when to use one.
    - The design draws no loading, no field error and no form result:
      the design system shows the first two, and a form's result, failure
      or denial included, is a toast. `loading`, `invalid`, `submitting`
      and `success` left the design states; a failed or denied submit's
      step sits on its submit button. LAYOUT-009 checks a form's stacked
      fields only, not a row of search and filters.
  - After the run of 2026-10-31 (16 minutes, $5.51 for design, $6.57 from
    scope; 22 known issues against yesterday's 88):
    - DESIGN-028 leaves nodes that show a record's value, and subflow steps,
      to their own words.
    - A node's `sample` is its whole line as it shows; assembly shows it for
      words that hold a {Noun.attribute}. Home's rows repeated their text.
    - The wireframes shrink a label to fit before cutting it: buttons were
      sized right but drawn with labels 25% larger. `weave wireframes`
      reads a run's 09-assemble.json envelope.
    - The node guide gives a marketing page a hero with a supporting
      sentence and features with their own headings.
  - The cost figures matched the bill on that run ($5.52 against $5.51).

- [x] **DS35** Page backgrounds as CSS (2 h) (done 2026-10-31). Depends: DS27
  - Why: a page hue and chroma rule out gradients and styled backgrounds
    (user, 2026-10-31).
  - Built 2026-10-31: the brief writes `pageBackground`, one CSS value of
    colors and gradients, for its first mode; the theme writes the dark
    mode's when the app has both. The page ramp is gone: `pageBg`, the solid
    color under the background and the base disabled colors fade into, and
    the page text are steps of the base or the brand ramp. BRIEF-006 and
    THEME-005 keep the background to colors and gradients; THEME-001 checks
    page text on every color in it. `template/colors.ts` has
    `pageBackground` beside `pageBg`; `html` paints `pageBg` and `body` the
    background.

- [ ] **DS33** `weave validate` for the design stages (30 min). Depends: DS23
  - Found building DS23: no design stage after the brief registers a
    `validate` hook, so `weave validate` reruns nothing on a design run.

- [x] **DS36** LAYOUT-008 on pages repeats THEME-007 (15 min). Depends: DS23 (done 2026-10-31)
  - Found in the wording pass: code sets a page's section gap from the
    theme's `main.sectionGap`, which THEME-007 checks against the same
    range. On a page, LAYOUT-008 can fail only when the theme failed, and
    the screen or widget call it routes to cannot change that gap.

- [x] **DS37** Fixes from the dashboard run (45 min) (done 2026-10-31). Depends: DS23
  - Why: the dashboard run of 2026-10-31 20:15 ended with 11 known issues
    at assemble, 5 of them sent to no call.
  - LAYOUT-009, LAYOUT-011 and LAYOUT-067 are warnings (user). Fixes broke
    009 and 011 again 9 times while fixing LAYOUT-001, and 067 is polish
    that stayed unfixed through 5 rounds.
  - The catalog's DESIGN-030 also wants a heading on a page without a
    title. The editor page had none, so the screen stage failed DESIGN-030
    in all 5 rounds, and DESIGN-015 stayed known at assemble.
  - Assemble sends LAYOUT-071 on a region to its frame, which can draw
    smaller nodes; the message names that fix first.

- [x] **DS38** Confirmation words where they are written (1.5 h) (done 2026-11-01). Depends: DS37
  - Found in DS37: LAYOUT-063 fails on a confirmation's words, which the
    screen call writes into the instance's slots. Assemble never reruns the
    screen stage, so its 2 issues stay known. The check belongs where the
    words are written.
  - Built 2026-11-01 (user chose each part to its writer): DESIGN-048
    checks the words. The screen call's slot words on a confirmation are one
    sentence each, and a slot beside the title names the record; a widget
    that serves a confirmation's step keeps its own text, or its sample, to
    one sentence that names the record. The screen prompt says so.
  - LAYOUT-063 keeps one text node and two buttons, since a dialog can be
    two widgets, as the reading list's is, and only assembly shows them
    together. It goes back to the widgets placed on the dialog.
    `confirmingSteps` serves DESIGN-047 and 048.

- [ ] **DS39** Assemble's second fix pass (45 min). Depends: DS37
  - Found in DS37: issues a fix brings in at assemble get no round. With
    LAYOUT-011 a warning, the dashboard run would have had none, so this
    waits for a run that needs it. A second pass needs fix calls named per
    pass, as `-fix` is now reused.

- [x] **DS41** Fixed column gaps set by code (2.5 h) (done 2026-11-01). Depends: DS37
  - Why: LAYOUT-001 wanted each box's gap smaller than its parent's, so a
    form's 16 between fields inside a 16 column failed it, and its fixes
    broke LAYOUT-009 and 011 (dashboard run, 2026-10-31). The user chose
    fixed values, set by code, with a rule on the shape (2026-11-01).
  - `02design/gaps.ts` sets each column's gap in a draw build and an invent
    design, before their checks and in what they write: a title and its
    description 4, a header and its content or content to content 16, two
    or more groups 24. A list's repeated items and paragraphs keep the
    model's gap. LAYOUT-001 now fails a header above two or more groups in
    one column, which no gap fits. H-09 is part of H-01, and LAYOUT-009 is
    gone. The node guide says which gaps code sets.
  - The assemble routing test uses LAYOUT-070, a hero padded under the
    overlay header, as its issue found only on the assembled page.

- [x] **DS42** The brief and the theme in one call (4 h) (done 2026-11-01). Depends: DS35, DS41
  - Why: the user merged them (2026-11-01, D3.3 F), so one call picks the
    hues, chromas and steps together, and the brief's two review calls go.
  - `01theme` holds the stage: the brief's schema (`brief.ts`, without
    `pageBackground`), its fonts and its rules beside the theme's. The call
    answers the brief first, then `colors` as a list of modes, each with its
    own `background` and its entity sets by noun, then the layouts and the
    defaults. It runs on the strong model at high, drafting at 0.7, 32k.
  - The prompt says how code makes a ramp and which steps read on which in
    every hue (`stepGuide`, the worst case over all hues and chromas), asks
    for the mood the page should put people in, and lets the feel choose
    the background freely within colors and gradients (user).
  - THEME-010 holds the modes and entity sets to the brief; BRIEF-006 went,
    since THEME-005 checks each mode's background. One artifact,
    `02-design/01-theme.json`, holds `{ brief, theme }`; `designInputs` and
    `weave app` read it. The later stages moved down one number, 03architect
    to 02architect through 09assemble to 08assemble, with their artifacts.

- [x] **DS43** The theme designs the logo (1.5 h) (done 2026-11-01). Depends: DS42
  - Why: the user asked the theme for a logo with its text color and font
    (2026-11-01), as a wordmark kept in the design artifacts. The app ships
    no image files and the design system has no icons for a mark.
  - The call writes `logo`: which of the brief's fonts, the weight, the case
    and the letter spacing, and each mode a `logo` color step. The theme
    holds the family, the spacing in em and a hex per mode. THEME-011 checks
    the weight against the font and 3:1 on the frame and the page.
  - The frame prompt says to name the wordmark in its `what`; the
    wireframes draw that node in the logo's style, loading nothing, and the
    design summary names it.

- [x] **DS44** The theme picks the status colors (1 h) (done 2026-11-01). Depends: DS43
  - Why: agreed on 2026-10-31 and paused; the user asked for it again
    (2026-11-01), so the status colors fit each theme's mood instead of
    staying the template's.
  - The brief writes `statusHues`, each inside its band (BRIEF-007: success
    135 to 180, warning 65 to 100, error 0 to 45, info 220 to 270). Code
    builds a ramp per status at the brand's chroma, at least balanced; each
    mode picks a `status` set per status. The THEME rules check them like
    every set, and `weave app` writes them into `colors.ts`.

- [x] **DS45** DESIGN-028 leaves the wordmark to the app's name (15 min) (done 2026-11-01). Depends: DS43
  - Found reconciling the theme: in the dashboard run DESIGN-028 made the
    header wordmark SH1.n01 say "Dashboards", the label of the page it
    links to. The wireframes draw a wordmark's own text as the logo, so it
    must stay the app's name.
  - DESIGN-028 now asks a frame's wordmark, a shell node whose `what` says
    wordmark, to say the app's name, and its frame-link check passes it by.

- [x] **DS46** The theme prompt holds no idea's words (5 min) (done 2026-11-01). Depends: DS42
  - Why: its examples came from the dashboard idea (a faint grid, glows, a
    neon border, "electric"), which could pull every app toward that look
    (user, 2026-11-01). The examples are neutral now: a tint, a gradient or
    a pattern drawn with repeating gradients, and a dark button with a
    bright border.

- [x] **DS47** Card borders show on the whole page background (15 min) (done 2026-11-01). Depends: DS46
  - Why: in the dashboard run of 2026-11-01 01:07 the cards' borders
    vanished on the background's teal glow (user). A Card draws its border
    with the page's `divider`, which THEME-009 checked only on `pageBg` and
    `frameBg`; on the glow it was 1.09:1.
  - THEME-009 also holds the divider to 1.1:1 on every color of the page
    background, with a fix in its message, and the theme prompt says cards
    draw their borders with the divider.

- [x] **DS48** Paragraphs under a heading keep their spacing (10 min) (done 2026-11-01). Depends: DS41
  - Why: the dashboard run of 2026-11-01 01:07 had 34 LAYOUT-013 warnings.
    DS41 took a heading over two or more paragraphs for a title and its
    description and set 4px between the paragraphs, which want 8 to 12.
  - A header group is now a heading and exactly one text. A heading over
    paragraphs keeps the model's gap, as paragraphs alone do: one gap
    cannot be 16 under the heading and 8 to 12 between paragraphs.

- [x] **DS49** New components have slots the screen fills (1.5 h) (done 2026-11-01). Depends: DS48
  - Why: in the dashboard run of 2026-11-01 01:07 the editor showed two
    WidgetBoards, and its cards and widget bodies sat in screen boxes
    beside the board. The board's and the card's slots were invent's, which
    runs beside the screen call, so the screen could not place into them.
  - The catalog gives each new component its slots, as it does a widget's.
    Invent draws them (DESIGN-044's component rule). The screen sees them
    and places instances in them; DESIGN-029 and DESIGN-038 read a
    component's slots through `slotsOf`. Assembly gives a component placed
    on its own its slot nodes, with the instances placed in them inside.
  - A rule that a component a widget holds is never also a part of the
    screen was dropped (user): a small reusable component can be both.

- [x] **DS50** A step that goes on to another screen links there (60 min) (done 2026-11-01). Depends: DS49
  - Why: in the ecommerce run of 2026-11-01 01:50 no control opens S04
    Order confirmation or S11 Order detail, so an owner cannot open an
    order and a checkout never reaches its confirmation. Severe (user).
  - Step file: `docs/steps/65-DS50-step-links.md`.
  - Of several screens that run a shared subflow, a lead keeps those that
    list something of the step's own flow. Without that, a note's delete in
    the freelancer run led to five confirm dialogs of other records.

- [x] **DS51** The wordmark is a leaf (10 min) (done 2026-11-01). Depends: DS45
  - Why: in the freelancer run of 2026-11-01 01:50 boxes whose `what`
    mentions the wordmark matched as the wordmark, so the wireframes drew
    the logo over the sidebar's navigation.
  - Step file: `docs/steps/66-DS51-wordmark-leaf.md`.

- [x] **DS52** Step wording is a warning (10 min) (done 2026-11-01). Depends: DS51
  - Why: DESIGN-028's step wording made 24 of the 33 known issues of the
    three runs of 2026-11-01, mostly controls in error states or tagged
    with a step they do not do (user: a noisy check becomes a warning).
  - Step file: `docs/steps/67-DS52-step-wording-warning.md`.

- [x] **DS53** A fixed-height region fits what the frame puts in it (65 min) (done 2026-11-01). Depends: DS42
  - Why: LAYOUT-071 stayed known in all three runs of 2026-11-01: THEME-006
    sizes a fixed bar for the smallest button while frames place the
    default size, and the frame never checks its regions in its own rounds.
  - Step file: `docs/steps/68-DS53-fixed-region-fit.md`.
  - The screens fixture's shells mirror the theme's layouts, so their
    headers went to 72 too, and the LAYOUT-071 mutation sets its bar back
    to 56 to keep its md button too tall.

- [ ] **DS54** Each delete that asks first has its own confirm dialog (30 min). Depends: DS50
  - Found in DS50: in the freelancer run of 2026-11-01 01:50 deleting a
    note (F09.S05) and a task (F17.S02) run the confirm subflow, but the
    architect gave them no dialog. The five confirm dialogs there belong to
    other records, so neither delete can ask first.

- [x] **DS40** DESIGN-028 on a step goes to the widgets serving it (15 min) (dropped 2026-11-01, DS52). Depends: DS37
  - Found in DS37: DESIGN-028 at a step id (F01.S02) has no owner, as
    DESIGN-008 had. Routed to several widgets, each fix call picks a
    wording on its own, so they may still differ.
  - Dropped: DS52 made the step wording a warning, so nothing routes it.

- [ ] **DS29** Fallback: design ends at invent (1 h). Depends: F15
  - Why: the MVP backup (user, 2026-10-31). Pick it up only if the design
    chain committed with F15 can't run cleanly on the freelancer idea after
    about two hours of fixes. It drops draw, frame and assemble, the kind of
    work that cost about $11 of the $14.10 design run on 2026-10-30.
  - `PIPELINE` ends design at `design-invent`. `design-draw`, `design-frame`
    and `design-assemble` leave it; their code stays.
  - FE2 builds routes, navigation and page shells from
    `02-design/03-architect.json`: its screens, its navigation, and each
    screen's placements in order. A shell's manifest lists its widgets in
    reading order, in place of sections and nodes.
  - FE3 builds each component in `02-design/06-invent.json`.
  - FE4's page task gets each placed widget's kind, purpose, copy text,
    steps and data, plus the theme's defaults. The session picks the
    design-system components itself, checked by MCP `validate`,
    `pnpm typecheck`, `pnpm nx lint web` and `pnpm verify <route>`.
  - FE5 takes its routes from the architect's screens.
  - The FE2 to FE5 step files follow.
  - Done when: `PIPELINE` has no draw, frame or assemble; the FE2 to FE5
    step files read only the architect and invent artifacts;
    `pnpm typecheck`; `pnpm test`.

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

- [x] **C4** Prompt and stage, in parallel with design (40 min) (folded into C7, 2026-11-01). Depends: C3, DS7
  - `prompt.ts` fills `src/agents/03contract/prompts/prompt.md` (draft provided);
    `weave run` runs design and contracts with `Promise.all` after flows, both
    recording the same flows version.
  - Done when: golden freelancer workspace produces a contract with zero mandatory issues.

- [x] **C7** The contract covers every widget (1.5 h) (done 2026-11-01). Depends: C3, DS23
  - Why: the contract is the shortest stage, and its only check for the MVP
    is that every UX element is covered: no widget without a source for its
    data, no step without the operation it calls (user, 2026-11-01).
    Backend feasibility is out of scope.
  - The stashed C1 to C3 code moved to `src/agents/03contract/` in the stage
    layout. The contract now holds entities with plain fields, enums,
    operations with the flow fields they take, and the operations that load
    each widget (`widgets`).
  - Removed: `compile.ts`, `conventions.ts`, seed rows, invalid examples,
    auth settings, access, errors, lifecycles, transactions, open business
    rules, and CONTRACT-005, 006, 008, 009 and 013 to 019.
  - CONTRACT-007 checks inputs; CONTRACT-012 checks that every field a widget
    asks for goes to an operation of its flow; CONTRACT-020 checks that every
    value a widget shows is a field and is loaded by one of its reads.
  - The stage reads the scope, the flows and the design catalog's widgets.
    It runs after `design-catalog`, side by side with screen, invent, draw
    and frame, so `--to contract` stops before the screen calls.
  - Done when: `pnpm typecheck`; `pnpm test`. The first live run waits for
    the user's go.
  - First live run 2026-11-01, on the new golden sets (user): zero
    mandatory issues for all three. Dashboard 1 round, $0.07; ecommerce 2
    rounds, $0.11; freelancer 2 rounds, $0.13. Round 1 missed only `reads`
    entries (CONTRACT-020, 3 and 4), which the patch round fixed.
  - All 7 misses were add forms, which show what the user types in: the
    rule was wrong, and the fix round added reads such as `getOrder` before
    the order exists. CONTRACT-020 now needs no read for a record that the
    widget's flow creates; an edit form still reads its record (user). The
    rerun passed all three in 1 round: dashboard $0.07, ecommerce $0.09,
    freelancer $0.10.

- [x] **C5** Renderer (30 min) (done 2026-11-01). Depends: C4
  - `03-contract.md` with paths from the conventions. Optional: `03-openapi.json`.
  - Done when: renders the golden freelancer-workspace contract.
  - Built after C7 (user): no paths, since C7 removed the conventions, and
    no OpenAPI file. `render.ts` lists the entities, enums and operations,
    then every catalog widget with what covers it: what it shows and the
    reads that load it, where each field it asks for goes, and what each of
    its steps calls. The stage writes it beside `03-contract.json`; the
    three golden sets have it.

- [x] **C6** Every golden idea (40 min) (done 2026-11-01). Depends: C5
  - Save golden `03-contract.json` for each.
  - Done when: **G3**.
  - Saved from the C7 rerun (user), without C5: the JSON reads fine. G3
    holds without its old parts: the contract runs beside the screen calls,
    not beside all of design, and C7 removed seeds.

## Phase 5: Reconciliation and freeze (dropped 2026-11-01)

Dropped (user, 2026-11-01): reconciliation is out of scope. The contract
stage checks that every widget has the records and operations it needs
(C7), and later stages read the flows, design and contract as their stages
wrote them, with no freeze. Its spec, step files 30 to 35 and the draft
patch prompts are deleted; OPTIONS.md section 5 stays as a record.

- [x] **R0** Rescope reconciliation after C7 (30 min) (dropped 2026-11-01). Depends: C7
- [x] **R1** Coverage matrix (60 min) (dropped 2026-11-01). Depends: C6, DS9
- [x] **R2** Mismatch rules (60 min) (dropped 2026-11-01). Depends: R1
- [x] **R3** Patches (60 min) (dropped 2026-11-01). Depends: R1
- [x] **R4** Patch prompts (40 min) (dropped 2026-11-01). Depends: R3
- [x] **R5** Procedure, freeze, report (60 min) (dropped 2026-11-01). Depends: R2, R4
- [x] **R6** Seeded defects and every golden idea (60 min) (dropped 2026-11-01). Depends: R5

## Phase 6: Code (Nov 1 to Nov 2)

Decisions: D9.1 A, D6M.1 B, D6M.3 C, D6M.4 A, D7.1 B, D7.2 C, D7.4, D1.6,
D1.12 notes. Steps 70 to 79. The user replaced the first Phases 6 and 7 on
2026-11-01: one stage group, `src/agents/04code/`, builds the app, and the
coding agent writes no tests.

| # | Stage | Who | What |
| --- | --- | --- | --- |
| 1 | `code-scaffold` | code | The template in `runs/<id>/app`, the theme applied, the MCP built, the agent config and its container, a git baseline, and `.weave/`: one numbered folder per stage with its guidelines and inputs |
| 2 | `code-contract` | code, one structured call | The entity layer from the contract: types, a persistent store, one function per operation, seed rows, a sign-in session |
| 3 | `code-shared` | one Muse Code session | The new components into `components/`, then the widgets, forms and dialogs used on two or more screens into `blocks/` |
| 4 | `code-frames` | one session | The shells as `layout.tsx` and their parts in `components/`, the navigation and the frame changes; after shared, since a frame may use a shared piece |
| 5 | `code-pages` | one session per page | The page in `(routes)`, and its own widgets, forms and dialogs in `components/` beside it |

- Each stage writes one set of folders in `web/app` (user, 2026-11-01):
  contract to `entities/`, shared to `components/` and `blocks/`, frames to
  `components/` and `layout.tsx`, pages to `(routes)/`.
- Sessions run one after another: they share one app folder, one git tree
  and `pnpm verify`'s port 3001.
- A check that needs no browser, no Storybook and no idea context runs in
  the design-system MCP while the agent writes; every other check runs after
  the session (user, 2026-11-01).
- Each session unit runs on `runSpecStage`. Round 1: the session, the
  checks, both reviewers. Round 2: a fix session for every failed check and
  blocker, the checks, both reviewers. Round 3: a final fix session and the
  checks. What is left is known, and the run goes on.
- Checks, without the agent: MCP validate on every changed file, typecheck,
  lint, the session's write paths, every design node's `data-testid`, every
  operation the unit's widgets read; on a route, `pnpm verify` and the
  rendered checks DESIGN-R-001 to 009 (axe, contrast, the keyboard walk and
  target sizes among them). `next build` runs once after the last page.
- Two reviewers read each unit's diff. One checks code quality, readability
  and clean organization, the product's selling point. The other checks
  adherence to the design, the theme and the behavior the flows and the
  contract describe. Neither repeats the checks. Code-written stages have
  no reviewers; the generator's tests cover them.
- The design may hold errors: the agent makes its own call, builds what the
  flow needs and lists the call in its summary. It gets the questions,
  answers and known issues of earlier stages and rounds, ranks them, and
  fixes only blockers.
- Rough cost from FE8: about $20 to $28 for the freelancer workspace and $8
  to $12 for the dashboard editor.

- [x] **CD1** App and theme (1.5 h) (done 2026-11-01). Depends: DS4a, FE8
  - `src/agents/04code/01scaffold/`: the `code-scaffold` stage copies
    `template/` into `runs/<id>/app`, installs it, builds the MCP and
    applies the theme with `applyTheme` (moved here from the theme
    preview). A light-only or dark-only theme pins its mode. THEME-003
    proves the applied colors. `prepareApp` (FE1) writes the agent config
    and the git baseline. `PIPELINE` gets `code-scaffold` to `code-pages`
    in place of `scaffold`, `codegen`, `apitest` and `frontend`.
  - Step file: `docs/steps/70-CD1-app-and-theme.md`.
  - Done when: `pnpm test`; the stage on `20261101-0150-freelancer-workspace`
    gives an app whose `pnpm typecheck`, `pnpm mcp:check` and
    `pnpm verify /` pass with the theme's colors.
  - Done 2026-11-01: `scaffoldApp`, `applyTheme` and the mode pin in
    `04code/01scaffold/`, THEME-003, the ledger write shared with the
    session. The freelancer run's app themed light-only, typecheck,
    `mcp:check` and `verify /` pass. The copy still drops the lockfile, as
    `weave app` did, so the install resolves fresh (about 2 minutes).

- [x] **CD2** The `.weave` folders (2 h) (done 2026-11-01). Depends: CD1
  - Why: each stage sees its own inputs and the earlier stages', and each
    folder carries its guidelines (user, 2026-11-01).
  - The scaffold writes `.weave/01-scaffold/` (guidelines for every
    session, scope, flows, theme, contract, routes, questions with answers
    and known issues no unit owns), `02-contract/`, `03-shared/` (each new
    component's and shared widget's design), `04-frames/` (shells,
    navigation, frame changes) and `05-pages/<screen>/` (the page and its
    dialogs, their nodes, the steps they serve, the operations their
    widgets read, the known issues that touch them).
  - The app-wide guidelines replace `src/engine/guidelines.md` (FE9). They
    add: the design may hold errors, so make your own call and list it;
    rank the questions and known issues first and fix only blockers; end
    with a summary of priorities, calls, files and what was not built.
  - Step file: `docs/steps/71-CD2-weave-folders.md`.
  - Done when: `pnpm test` on the golden freelancer set: every folder is
    written, and each page's slice holds its nodes and no other page's.
  - Done 2026-11-01: `weave.ts` slices the run, `inputs.ts` reads it, the
    app-wide guidelines replace `src/engine/guidelines.md`. The freelancer
    run's tree: 12 page folders of 25 to 68 KB, 2 shared widgets, the shared
    dialog S17, 2 shells. A shared widget's words and test ids differ per
    page, so a block takes them as props.

- [x] **CD3** The agent in Docker (2 h) (done 2026-11-01). Depends: CD1
  - Why: headless Muse Code runs shell commands with no approval prompt
    (user, 2026-11-01). The container is the sandbox; Muse's own needs
    bubblewrap, which is not installed here.
  - `docker/agent.Dockerfile` (Node 22, pnpm, git, Chromium, the Muse
    launcher), built by the scaffold when missing. `runSession` runs
    `muse exec` in it with the app mounted, the user's uid and the key on
    stdin. `MUSE_DOCKER=0` runs it on the host as now.
  - Cut first if time runs short: sessions work on the host.
  - Step file: `docs/steps/72-CD3-agent-docker.md`.
  - Done when: `pnpm test`; `docker build` passes; a fake `muse` in the
    container edits the app and leaves the files the user's.
  - Done 2026-11-01: `docker/agent.Dockerfile` (Node 24, the host's major,
    and Chromium; 3.4 GB), tagged by its hash and built by the scaffold when
    missing. Muse Code is mounted read-only from the host install
    (`~/.local/bin`, a 415 MB binary) instead of fetched in the image. A fake
    `muse` in the container got the key on stdin and wrote a file the user
    owns. `MUSE_DOCKER=true` by default. The real session waits for the
    user's go.

- [x] **CD4** Contract code (2 h) (done 2026-11-01). Depends: CD2, C7
  - `src/agents/04code/02contract/`: the `code-contract` stage writes
    `web/app/entities/<entity>/` by code: zod types, a
    `createPersistentStore` store, one function per operation named by its
    id (the C7 contracts have only list, get, create, update and delete),
    hooks for reads, seed rows from one structured call. `entities/session/`
    signs up and in with any email. Latency and a fail switch serve the
    loading states and T1's failure alternatives.
  - Answers S6: no route handlers, no API tests (D6M.1 B, user, 2026-11-01).
  - Step file: `docs/steps/73-CD4-contract-code.md`.
  - Done when: `pnpm test` with a snapshot of the golden freelancer
    contract's output; the generated layer typechecks and lints.
  - Done 2026-11-01: `codegen.ts`, the seed call and SEED-001, the
    `code-contract` artifact, `.weave/02-contract/`. Plain TypeScript types,
    no zod: the template has none. Sign-in lives in `entities/auth/`, since
    the freelancer contract has a `Session` entity. Written into the
    freelancer app with stand-in seed rows: MCP validate, typecheck and lint
    pass. The live seed call (about $0.05) waits for the user's go.

- [x] **CD5** Code rounds in the stage runner (2.5 h) (done 2026-11-01). Depends: CD2, FE1
  - `runSpecStage` learns a schedule per stage, output reviewers as a list
    and a review input template; the spec stages keep D1.12's schedule. A
    session `Compose` in `src/engine/` makes drafts and fixes Muse Code
    sessions. The checks become issues CODE-001 to 008; the rendered checks
    keep their DESIGN-R ids. Each session gets write paths; anything else
    fails CODE-004. One runner per unit, as draw has one per widget.
  - Step file: `docs/steps/74-CD5-code-rounds.md`.
  - Done when: `pnpm test` with a fake `muse`: a unit failing typecheck in
    round 1 is fixed in round 2 with the reviewers' blockers; a unit still
    failing after round 3 is known and the run goes on.
  - Done 2026-11-01: the runner takes `schedule`, named output reviewers,
    `reviewInput` and `reviewersSeeAll`; spec stages run as before (their
    32 tests unchanged). `src/engine/compose.ts`, `checks.ts` (CODE-001 to
    008, and CODE-009 for a session that never finished) and `server.ts`
    (one dev server for verify and the rendered checks). Found by the
    tests: write paths are judged over the unit's whole diff, since a fix
    that leaves a bad file alone has not undone it; a session that changes
    nothing no longer fails its commit.

- [x] **CD6** Code reviewers (1 h) (done 2026-11-01). Depends: CD5
  - `src/agents/04code/prompts/`: `review-code.md` (quality, readability,
    organization) and `review-adherence.md` (design, theme and behavior),
    with an input that carries the diff, the unit's `.weave/` files, the
    agent's summary and the failed checks.
  - Step file: `docs/steps/75-CD6-code-reviewers.md`.
  - Done when: `pnpm test`: both guides fill; a blocker reaches the fix.
  - Done 2026-11-01: `review-code.md`, `review-adherence.md`,
    `review-input.md` and `fix-task.md` in `src/agents/04code/prompts/`;
    `unit.ts` runs a unit with both. The reviewers read the guidelines and
    the task, the unit's own folder, the diff and the agent's summary.

- [x] **CD7** Shared (1 h) (done 2026-11-01). Depends: CD4, CD6
  - `src/agents/04code/03shared/`: one session for the new components, then
    the shared widgets, in `components/` and `blocks/`; skipped when
    nothing is shared.
  - Step file: `docs/steps/76-CD7-shared.md`.
  - Done when: `pnpm test` with a fake `muse`.
  - Done 2026-11-01: `sharedSpecs` and `runShared`; the unit runs through
    `runUnit`, whose fake-`muse` tests cover the rounds. No real session yet.

- [x] **CD8** Frames (1 h) (done 2026-11-01). Depends: CD7
  - `src/agents/04code/04frames/`: one session for every shell's layout,
    the navigation, the frame changes and the sign-in guard; checks on `/`
    and one route per shell.
  - Step file: `docs/steps/77-CD8-frames.md`.
  - Done when: `pnpm test` with a fake `muse`.
  - Done 2026-11-01: one unit writing `(routes)/(<shell name>)/layout.tsx`
    and `components/`, every frame node's test id checked. No page sits in a
    shell yet, so the browser checks run on the starter route `/`; the
    pages check the frames in place.

- [x] **CD9** Pages (1.5 h) (done 2026-11-01). Depends: CD8
  - `src/agents/04code/05pages/`: one session per page with its dialogs and
    single-use widgets, in the navigation's order, every check on its
    route; `next build` after the last page.
  - Step file: `docs/steps/78-CD9-pages.md`.
  - Done when: `pnpm test` with a fake `muse`.
  - Done 2026-11-01: one unit per page, the navigation's first; each writes
    `page.tsx` and `components/` in its shell's route group; a `[xId]` param
    opens on entity X's first seed row; the root page replaces the starter
    page; `next build` once after the last page (CODE-008, known when it
    fails). The builders are tested on the golden set; the stage itself has
    not run against a real app.

- [ ] **CD10** Golden apps end to end (1.5 h). Depends: CD9
  - The dashboard editor first (about $8 to $12), then the freelancer
    workspace (about $20 to $28), each on the user's go; every flow walked
    by hand; the numbers in `fixtures/golden/README.md`.
  - Step file: `docs/steps/79-CD10-golden-apps.md`.
  - Done when: **G5** and **G6**.

### Replaced by the code stages (2026-11-01)

- [x] **S1** Scaffold and theme apply (90 min) (folded into CD1, 2026-11-01). Depends: DS4, DS4a
  - Folded into CD1 and CD2 (2026-11-01). The notes below are history.
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

- [x] **S6** Rescope S2 to S4 after C7 (30 min) (folded into CD4, 2026-11-01). Depends: C7
  - Folded into CD4 (2026-11-01): the entity layer by code, with no route handlers (D6M.1 B). The notes below are history.
  - Why: S2 to S4 build on `compile.ts`, the conventions, seed rows, errors,
    access and lifecycles, which C7 removed from the contract. The mock API
    needs some back, at least paths and seed data; this task says how much.

- [x] **S2** Contract codegen: types, client, hooks (90 min) (folded into CD4, 2026-11-01). Depends: S1, C2
  - Folded into CD4 (2026-11-01). The notes below are history.
  - `src/codegen/entities.ts` writes `web/app/entities/<entity>/` (zod schemas
    and types from `compile.ts`, `api.ts` on `Server`, `hooks.ts` on TanStack
    Query, `index.ts`) and `web/app/entities/auth/` (session hooks). `Server`
    learns the error envelope. A file ledger records every generated file.
  - Done when: the generated app typechecks and lints; a test compiles the
    golden contract and snapshots the output.

- [x] **S3** Mock API: route handlers and JSON store (2.5 h) (dropped 2026-11-01). Depends: S2
  - Dropped (2026-11-01): the entity stores replace the route handlers and the JSON file (D6M.1 B). The notes below are history.
  - `src/codegen/mockApi.ts` writes `web/mocks/seed.json`, `web/mocks/db.json`,
    `web/app/api/_mock/` (store with a write queue, http helpers, session) and
    one `route.ts` per path from the conventions: list, get, create, update,
    delete, action, and the four auth routes. Validation, access, pagination,
    filters, search, sort, relations on delete, lifecycle transitions, latency
    and forced failures come from the contract and the conventions.
  - Done when: `curl` against `pnpm dev` of the generated app creates a row
    that appears in `web/mocks/db.json` and in the next list call; every error
    code in the contract is reproducible.

- [x] **S4** Contract tests against the mock (60 min) (dropped 2026-11-01). Depends: S3
  - Dropped (2026-11-01): the app gets no tests from the coding stages, and the generator's tests cover the contract code (CD4). The notes below are history.
  - `src/codegen/apiTests.ts` writes `web/app/api/__tests__/<entity>.test.ts`
    per entity: every operation's happy path and every listed error, pagination
    and sort, cascade on delete, unauthenticated and cross-user access, and data
    surviving a store reload (D8.4 A to D, applied to the mock).
  - Done when: `pnpm nx test web` passes in the generated freelancer workspace.

- [x] **S5** Golden freelancer workspace to app (45 min) (folded into CD10, 2026-11-01). Depends: S4
  - Folded into CD10 (2026-11-01). The notes below are history.
  - `weave run … --to codegen` end to end; `pnpm build` of the app; record
    sizes and timings; fix codegen bugs found on the way.
  - Done when: **G5**.

## Phase 7: Frontend (folded into Phase 6, 2026-11-01)

Folded into Phase 6 (user, 2026-11-01): the shared, frames and pages
sessions build the frontend. The done tasks and the code built here stay.

- [x] **FE8** Muse Code trial on a golden app (1 h) (done 2026-11-01). Depends: C6, DS18
  - Why: the user moved the coding stages to Muse Code headless (D9.1 A,
    2026-11-01). It reads and edits anywhere in the app, runs the app's
    checks itself and fixes what they find, so the generator writes the
    setup and the task, not an agent loop. A probe ran it on Muse Spark Open
    through Baseten with a real tool call.
  - Scaffold one golden app with `weave app`, add the agent config by hand
    (design-system MCP, a hook that runs MCP validate after every edit, the
    trusted workspace, `AGENTS.md`), and give Muse Code one screen task on
    the Meta API (`muse-spark-1.3`), one run only (limited credits; the
    open-weight endpoints are proven by probes).
  - Record: steps, tokens, cost, wall time, what it wrote, and whether
    validate, typecheck, lint and `pnpm verify <route>` pass after it.
  - Step file: `docs/steps/69-FE8-muse-trial.md`.
  - Done when: the run is recorded, and the user decides on the runner.
  - Done 2026-11-01 overnight: one run built S04 and its dialog S08 in 6
    minutes for $1.07 (56 calls, 97.7% of the input cached). Our gate
    passed it: MCP validate, typecheck, lint and `pnpm verify /dashboards`
    at three widths; all 30 design nodes have their `data-testid` and every
    state is built. Report: `runs/20261101-0107-dashboard-editor/trial/REPORT.md`.
    The runner decision went to the overnight calls to review; FE1 went
    ahead as D9.1 A says.

- [x] **FE1** Muse Code runner (1.5 h) (folded into CD5, 2026-11-01). Depends: FE8, S1. Decision D9.1 A
  - Folded into CD5 (2026-11-01): `src/engine/` is the session the code rounds run, and the real session runs in CD10. The notes below are history.
  - `src/engine/`: writes the app's agent config (the MCP servers, the
    validate-after-edit hook, the trusted workspace, the endpoint: the Meta
    API, or Muse Spark Open on Baseten through `endpoint_transport`), commits
    a git baseline in the app, runs `muse exec --json --prompt-file` with a
    step cap, and reads its `run.usage` events into the run's events and
    costs.
  - After the run it does not trust the agent: it reruns the session's
    checks, records the git diff in the ledger with origin `model`, and fails
    the session when the diff touches a test or a generated folder
    (`entities`, `api`, `mocks`).
  - Done when: tests with a fake `muse` executable (a script that edits files
    and prints JSONL) show the usage read, the diff recorded, a test edit
    failing the session and a failing check failing it; a real session on
    the scaffolded freelancer workspace passes its checks.
  - Step file: `docs/steps/41-FE1-muse-runner.md`, rewritten for D9.1 A with
    what FE8 learned.
  > Blocked: the real session spends credits and waits for the user's go.
  > Built 2026-11-01 overnight: `src/engine/` (`setup.ts`, `muse.ts`,
  > `session.ts`, the hook and the guidelines), `MUSE_BIN` in the config,
  > and run totals that count a session's calls; 6 tests with a fake
  > `muse` pass.

- [x] **FE9** Development guidelines for the coding agent (1 h) (done 2026-11-01). Depends: FE8
  - Why: the task prompt stays short and names the files (user, 2026-11-01):
    "build screen S04 from `.weave/screens/S04.json`; follow every guideline
    in `.weave/guidelines.md`". The guidelines carry the detail.
  - `src/engine/guidelines.md`, copied into each app as
    `.weave/guidelines.md`: how to read the `.weave/` files (screen design,
    the flow steps it serves, the contract and which operations load each
    widget), data only through the entity hooks, every state (loading,
    empty, error, invalid, submitting), forms through the Form recipe, a
    `data-testid` on every node, the H1, where files go, never tests, and
    the checks that end a session.
  - Done when: the FE8 screen task, rerun with the guidelines, passes its
    checks.
  - Done 2026-11-01 overnight: the FE8 run already used these guidelines
    word for word and passed the gate, so there was no rerun (credits). The
    runner protects what they forbid (`packages/`, `tools/`, `.weave/`,
    `.muse/`, `.mcp.json`) besides tests.

- [x] **FE10** App MCP: the remaining checks while the agent works (2 h) (folded into CD5, 2026-11-01). Depends: FE1, FE5
  - Folded into CD5 (2026-11-01): the design check becomes CODE-005 and CODE-006, and the rendered checks run on each route after the session. The app MCP server is parked: the checks run after each session (user, 2026-11-01). The notes below are history.
  - Why: the agent validates while it runs instead of after (user,
    2026-11-01). The design-system MCP stays generic (it flags only wrong
    patterns), so the app's own checks get their own MCP.
  - Tools: the screen against its design (every section and widget, the
    `data-testid`s, the H1), each widget against the contract (the hooks of
    the operations that load it), and the rendered checks on a route
    (DESIGN-R-001 to 009 from `src/checks/`). The runner's gate after the
    run calls the same code.
  - Open: serve it from the generator (`src/`, so it reuses `src/checks/`
    and reads the run's files) or as `mcps/app/` with its own tooling; the
    step file decides.
  - Done when: each tool has a test with one passing and one failing page,
    and the FE8 screen task calls them during its run.
  - Built 2026-11-01 overnight, without the MCP: `src/engine/conformance.ts`
    derives what a screen's route folder must name (every node's
    `data-testid` for the page and its dialogs, the operations its widgets
    read) and checks it; the session gate runs it as the `design` check.
    It passes the FE8 page and fails a page missing a node. Not every
    operation of the screen's steps is required: a step's effect may run
    inside another (duplicating a dashboard copies its widgets).
  > Blocked: where the MCP server lives is the user's call (the SDK is only
  > in `mcps/frontend`); the rendered checks on a live route join the gate
  > with `resolveRouteSamples`.

- [x] **FE2** Routes, navigation and page shells from screens (90 min) (folded into CD8, 2026-11-01). Depends: S2
  - Folded into CD8 (2026-11-01): the frames session builds the shells and the navigation, and each page session its route. The notes below are history.
  - `src/codegen/pages.ts`: the page frame from `02-design/08-assemble.json`'s shells,
    one per kind: their regions docked as the layout says and filled from the
    shell nodes, the navigation among them, shared by every framed page of
    the kind. For every page screen a route folder with a `page.tsx` in its
    kind's frame (H1, sections with their node manifests as comments,
    `data-testid` per node), dialogs and drawers as files beside their page,
    a sign-in guard for `signedIn` screens.
  - Done when: the generated app builds and every route renders its H1;
    `pnpm verify` passes on every route.

- [x] **FE3** New components (60 min) (folded into CD7, 2026-11-01). Depends: FE1, FE2, FE9
  - Folded into CD7 (2026-11-01), without the axe test: the coding agent writes no tests. The notes below are history.
  - One Muse Code session per `newComponents` entry: the task names its
    design in `.weave/components/<Name>.json` and the guidelines; it writes
    `web/app/components/<Name>/` with the DS conventions and an axe test.
    Validate, typecheck, lint and `nx test web` end the session.
  - Done when: the dashboard editor's new component passes its checks.
  - Step file `43-FE3-new-components.md` predates D9.1 A; rewrite before go.

- [x] **FE4** Pages: sections wired to hooks (2.5 h) (folded into CD9, 2026-11-01). Depends: FE3, FE10
  - Folded into CD9 (2026-11-01). The notes below are history.
  - One Muse Code session per screen filling the shell's sections from the
    nodes, using recipes, the entity hooks and the DS, with loading, empty,
    error, invalid and submitting states. The task names the screen's
    `.weave/` files and the guidelines; the app MCP's checks and
    `pnpm verify <route>` end the session.
  - Step file `44-FE4-pages.md` predates D9.1 A; rewrite before go.
  - Nodes reach the session and the shell's manifests without `component`,
    which serves validation only; the session picks the component from
    `what` through the MCP (design spec, 2026-10-30). `size` and `look` come
    only on a node that overrides the theme's defaults, with its
    `overrideReason`; the recipes already carry the defaults (S1, DS10).
  - Done when: every freelancer-workspace route passes validate, typecheck, lint
    and verify, and the core loop works by hand.

- [x] **FE5** Rendered checks (90 min) (folded into CD5, 2026-11-01). Depends: FE2
  - Folded into CD5 (2026-11-01): its collectors run on each route after a session. The notes below are history.
  - `src/checks/`: DESIGN-R-001 to 009 with Playwright (axe, contrast, keyboard
    walk, target size, overflow, first viewport, type size, color variables,
    proximity), written as reusable collectors the benchmark reuses.
  - Done when: each rule has a test on a fixture page; the freelancer workspace's
    routes pass the mandatory rules.
  > Blocked: the second half needs a built app with routes (FE4). The
  > collectors, `runRenderedChecks` and their tests on fixture pages are in.
  - 2026-11-01: restored from the `fe` stash once DS50 to DS53 were
    committed (user). It needed no port: `src/checks/` still fits the
    layout and its 7 tests pass. `/reconciliate` on the FE part fixed two
    comments and the step file. The gate after each coding session (FE1)
    and the app MCP (FE10) run its collectors; `resolveRouteSamples` comes
    with the gate.

- [ ] **FE6** Visual rubric (45 min, optional). Depends: CD9
  - Screenshots to Muse Spark, scored 0 to 4 per concern with evidence
    (D3.8 A); warnings only.
  - Done when: a rubric report exists for the freelancer workspace.

- [x] **FE7** Golden freelancer workspace end to end (60 min) (folded into CD10, 2026-11-01). Depends: FE4, FE5
  - Folded into CD10 (2026-11-01). The notes below are history.
  - `weave run … --to frontend`; walk every flow by hand on the mock API.
  - Done when: **G6**.

## Phase 8: Benchmark (Mon Nov 2, morning)

Decisions: D13.1 to D13.5. Steps 48 to 54. Runs right after generation and
again after repairs; one table with every number.

- [ ] **B1** Production build and server (45 min). Depends: CD10
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

- [ ] **B3** Accessibility: axe, contrast, targets (45 min). Depends: CD5, B1
  - Reuse the FE5 collectors on the production server: axe violations by
    impact, contrast failures, small targets, per route and state.
  - Done when: `benchmark/accessibility.json` lists counts per route.

- [ ] **B4** Screen reader (60 min). Depends: B1
  - `src/bench/screenReader.ts`: the accessibility tree per route (aria
    snapshot) and a virtual screen reader pass: unnamed controls, landmark
    coverage, heading outline, labelled fields, dialog naming and focus, live
    regions, and the spoken phrase log saved per route.
  - Done when: `benchmark/screen-reader/*.txt` and counts per route exist.

- [ ] **B5** Keyboard navigation (60 min). Depends: CD5, B1
  - `src/bench/keyboard.ts`: Tab walk per route: reachability, focus visible,
    order against reading order, traps, Escape on dialogs, Enter and Space on
    controls, skip link.
  - Done when: `benchmark/keyboard.json` has percentages per route.

- [ ] **B6** Code quality and duplicates (90 min). Depends: CD10
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

- [ ] **T1** Playwright tests from the flows (2 h). Depends: CD1
  - With the entity stores (D6M.1 B), resets and forced failures go through
    the store's switches (CD4), not HTTP; the step file predates this.
  - `src/agents/tests/`: one `@playwright/test` spec per flow in `web/e2e/`,
    generated by code from steps, fields, alternatives and node IDs; the model
    only turns outcomes into assertions (structured call); a Playwright config
    with a seeded store and a `pnpm test:e2e` script in the app.
  - Done when: the golden freelancer workspace gets one spec per flow that compiles.

- [ ] **T2** Run, evidence, repair requests (60 min). Depends: T1, CD10
  - Run the specs, map failures to flow, step and screen, attach screenshot
    and trace, and write typed repair requests (D8.3 A); `06-e2e.md`.
  - Done when: the evidence table and the requests exist for a run with a
    planted defect.

- [ ] **T3** Bounded repair (90 min). Depends: T2, CD5
  - A Muse Code session per repair request (D9.1 A), 2 rounds, rerun only
    the failed specs; benchmark again after repairs. The runner fails the
    session when its diff leaves the screen's route and components or
    touches a test.
  - Done when: the planted defect is repaired within the limits; a test
    edit by the model fails the session and is logged.

- [ ] **T4** Golden freelancer workspace e2e green (45 min). Depends: T3
  - Done when: **G7**.

## Phase 10: Prove and submit (Tue Nov 3 to Wed Nov 4)

Decisions: D1.10 B, D12.1, D12.2. Steps 59 to 62.

- [ ] **P1** Run dashboard (90 min). Depends: B7
  - `src/dashboard/`: one static `dashboard.html` per run from `events.jsonl`,
    reports, the benchmark and screenshots.
  - Done when: `pnpm weave show <id> --html` opens a dashboard with the
    timeline, issues per round and the benchmark table.

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
3. The agent's Docker container (CD3, 2 h); sessions run on the host
4. Muse Image moodboard (D3.3 C) if it was ever started
5. The dashboard (P1) trimmed to the timeline and the benchmark table (saves
   about 45 min); the markdown reports carry the rest
6. The Modal run (P2) stopped after `design-assemble` instead of a full run (saves
   about 1 h; the open-weights prize needs the run to exist, not to be long)
7. Parallel design and contracts (run them one after the other)
8. The second repair round (T3); report what is still open instead

Never cut: schemas, validators, golden fixtures, the template-based
scaffold, the whole benchmark phase. They are what keeps the
output from drifting and what proves it, which is the whole idea.

## Risks

| Risk                                                         | Mitigation                                                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Meta's API rejects a schema shape                            | F2 sanitizes and F4 smoke-tests every construct used; keep schemas flat                     |
| Credits run out                                              | Replay cache, golden fixtures for offline work, Spark by default, costs logged per call     |
| Design outputs too big or inconsistent                       | Architect and catalog once, then calls per page, component, widget and shell (DS23); fixes return patches (F16) |
| Phases 6 to 9 get one day each                               | The contract compiler (C2) feeds codegen; page shells are code; the model fills sections    |
| The model writes outside its files or edits tests           | A session that writes outside its paths or touches a test fails (CD5)                       |
| Lighthouse or the browser won't start on WSL                 | Playwright's Chromium with `--headless=new`; every tool in the benchmark is optional per run |
| Prompt tuning turns into validator weakening                 | AGENTS.md forbids it; rule changes go through you                                           |
| A hosted endpoint rejects or mishandles `json_schema`         | Verified on Modal and Baseten 2026-10-29; the smoke test checks it before any run          |
