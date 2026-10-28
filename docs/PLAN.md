# Plan

Start: Wed 2026-10-28, 15:30 IST. Submit by Wed 2026-11-04 evening IST (the
portal closes Thu 2026-11-05, 07:30 IST). About 8 to 10 hours a day.

Phases 0 to 5 (restructure, foundation, flows, design, contracts,
reconciliation) are broken into tasks. Phases 6 to 10 are milestones; each
starts with a task that expands it into tasks, after you confirm the matching
decisions in OPTIONS.md.

**How to use this file** (full rules in `AGENTS.md`): take the first unticked
task whose dependencies are ticked; read the linked spec and decisions; do
only that task; run its **Done when**; tick it, append `(done YYYY-MM-DD)`,
commit as `<task id>: <summary>`. Blocked: add `> Blocked: <reason>` under it
and move to the next independent task.

## Milestones

| Gate | When          | Done when                                                                                       |
| ---- | ------------- | ----------------------------------------------------------------------------------------------- |
| G0   | Oct 28, 16:30 | Repo restructured; template checks pass from `template/`                                        |
| G1   | Oct 29, 01:30 | The three tuning ideas produce scope and flows with zero mandatory issues; client notes (unseen) run once and recorded; golden fixtures saved |
| G2   | Oct 29, night | Every golden idea produces brief, theme and screens with zero mandatory issues; gap report works |
| G3   | Oct 30, 13:00 | Every golden idea produces a contract, in parallel with design; seeds validate                 |
| G4   | Oct 30, night | Every golden spec set frozen; seeded defects found and fixed within limits                     |
| G5   | Oct 31        | Project tracker's API runs in Docker from the frozen contract; CRUD written by a generator; contract tests pass |
| G6   | Nov 1         | Project tracker works end to end by hand: themed frontend, new components built, data wired    |
| G7   | Nov 2         | Project tracker's e2e tests, generated from flows, pass after bounded repairs                  |
| G8   | Nov 3         | Two end-to-end ideas generated without manual edits (or every edit logged); one deployed; release script and dashboard work |
| G9   | Nov 4         | Demo video recorded, README has real numbers, submitted                                        |

---

## Phase 0: Restructure the repository (Oct 28, 15:30 to 16:30)

Done on 2026-10-28 on branch `hackathonv2`. Decisions: D0.1 to D0.4.

- [x] **M1** Commit the finished design-system components (done 2026-10-28)
  - `hackathon` holds the finished design system and stays as it is.

- [x] **M2** Restructure the repository (done 2026-10-28). Depends: M1
  - Everything moved into `template/`, the MCP into `mcps/design-system/`
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

- [ ] **M5** Read the official rules and submission form (15 min)
  - You: the dates and judging weights in `docs/README.md` come from a press
    summary of the official page. Check the official rules and the submission
    form for anything that changes what to build: demo length, repository
    visibility, required write-up, track and theme.
  - Done when: `docs/README.md` "Facts" says what you confirmed, with the link.

## Phase 1: Agent foundation (Oct 28, 16:30 to 20:15)

Spec: [ARCHITECTURE.md](ARCHITECTURE.md). Decisions: D1.1 to D1.9.

- [ ] **F1** Root package and tooling (20 min). Depends: M3
  - `pnpm add openai zod execa p-limit` and
    `pnpm add -D typescript@~5.9 tsx vitest @types/node@^22`. TypeScript 5.9
    matches the template and the MCP; `@types/node` 22 matches the lowest
    supported Node. (A trial install picked TypeScript 7.0 by default, which
    also typechecked; pinning keeps one compiler across the repo.)
  - `cp .env.example .env` and set `MODEL_API_KEY`.
  - `src/core/env.ts`: loads `.env` with `process.loadEnvFile()` when the file
    exists, validates the variables in `.env.example` with zod, exports a typed config.
  - Done when: `pnpm typecheck` passes and `pnpm test` runs `src/core/env.test.ts`.

- [ ] **F2** Schema bridge (30 min). Depends: F1
  - `src/core/schema.ts`: `toJsonSchema(schema, name)` wraps `z.toJSONSchema`,
    drops `$schema`, rewrites `oneOf` to `anyOf`, throws on recursive `$ref`s or
    nesting deeper than 10, and returns property and enum counts.
  - Done when: tests cover a nested schema passing, a recursive one throwing, a
    depth-11 one throwing, and a discriminated union coming out as `anyOf`.

- [ ] **F3** Model client (60 min). Depends: F2
  - `src/core/llm.ts`, as in ARCHITECTURE "Model layer":
    `generateStructured({ stage, round, schema, schemaName, messages, model })`
    returns `{ data, raw, usage, costUsd, replayed }`.
  - The OpenAI client is injectable so tests pass a fake.
  - Done when: tests (no network) cover success; 429 then success honouring
    `Retry-After`; `finish_reason: 'length'` retried once with more tokens, then
    an error; replay hit and miss; cost from usage.

- [ ] **F4** Smoke test (15 min). Depends: F3
  - `src/smoke.ts`: a toy schema with nested arrays, an enum, a nullable number
    and a discriminated union, sent to the real API.
  - Done when: `pnpm smoke` prints the parsed object, tokens and cost. If the
    schema bridge needed changes for the API to accept it, note them in
    ARCHITECTURE.md under "Model layer".

- [ ] **F5** Runs, artifacts, events, issues (40 min). Depends: F1
  - `src/core/run.ts`, `artifacts.ts`, `issues.ts`: run IDs like
    `20261028-2010-project-tracker`; envelope with canonical hash, version and
    inputs; `isStale`; `appendEvent`; `writeReport`; `state.json`.
  - Done when: tests cover hash independence from key order, version
    increments, staleness after an input changes, and the mandatory/warning split.

- [ ] **F6** Stage runner and prompt loader (30 min). Depends: F3, F5
  - `src/core/runSpecStage.ts` as in ARCHITECTURE "Stage runner" (D1.5 A, D1.6
    A, D1.8 B); `src/core/prompt.ts` loads a `.md` file and fills
    `{{placeholders}}`, throwing on any it can't fill. It strips HTML comments
    first (prompt files and idea files keep notes for us in them).
  - Done when: tests with a fake model show issues in round 1 fixed in round 2;
    persistent issues end in `StageFailed` with the report after 3 rounds;
    round 3 uses the `strong` model.

- [ ] **F7** CLI (30 min). Depends: F6
  - `src/cli.ts` with `node:util` `parseArgs`:
    `run <idea.md> [--run <id>] [--from <stage>] [--to <stage>] [--interactive] [--no-replay]`,
    `validate <runId> [stage]` (validators only, no model calls), `show <runId>`,
    `ds` (filled in by DS1).
  - Done when: `pnpm weave run fixtures/ideas/project-tracker.md --to scope`
    creates a run folder (with a stub stage until FL5) and `pnpm weave show
    <id>` prints its stage table and token totals.

## Phase 2: Scope and flows (Oct 28, 20:45 to Oct 29, 01:30)

Spec: [specs/flows.md](specs/flows.md). Decisions: D2.1 to D2.7.

- [ ] **FL1** Capabilities and schemas (40 min). Depends: F2
  - `src/config/capabilities.ts` and `src/stages/flows/schema.ts`, as in the spec.
  - Done when: a test passes both schemas through `toJsonSchema`; `pnpm typecheck`.

- [ ] **FL2** Validators with tests (90 min). Depends: FL1
  - Every SCOPE and FLOW rule in `src/stages/flows/validate.ts`.
  - Fixtures in `src/stages/flows/__fixtures__/`: a small hand-written valid
    scope and flows for a reading-list app (5 flows; deliberately not one of the
    reference ideas, because its flow becomes the prompt's format example), and
    one mutation per rule.
  - Done when: each rule has a passing and a failing test; `pnpm test` is green.

- [ ] **FL3** Prompts (30 min). Depends: FL1
  - Review and finish `src/stages/flows/prompt-scope.md` and `prompt-flows.md`
    (drafts provided). Placeholders: capabilities, scope, answers, example flow
    (from the valid fixture).
  - Done when: a test fills both prompts with no missing placeholders.

- [ ] **FL4** Renderer (30 min). Depends: FL1
  - `src/stages/flows/render.ts`: `01-scope.md` (short) and `01-flows.md` in the spec's format.
  - Done when: a snapshot test renders the valid fixture.

- [ ] **FL5** Wire the stage (30 min). Depends: FL2, FL3, FL4, F7
  - `src/stages/flows/stage.ts`: scope, then (with `--interactive`) blocking
    questions with their defaults on the terminal, answers saved to
    `input/answers.json`, then flows. Register in the CLI.
  - Done when: `pnpm weave run fixtures/ideas/project-tracker.md --to flows`
    ends with zero mandatory issues or a readable `StageFailed` report.

- [ ] **FL6** Reference ideas (60 min). Depends: FL5
  - Tune on project tracker, dashboard editor and appointment booking: change
    prompts, never validators, until each passes within 3 rounds. Read every
    `01-flows.md` and fix the prompt for anything you'd reject.
  - Then run client notes once, untuned: it's the unseen test. Record what
    happened, even if it fails; fix prompts only for failures that also show up
    on the other ideas.
  - Save accepted artifacts to `fixtures/golden/<idea>/01-scope.json` and
    `01-flows.json`; record rounds, tokens and cost per idea in
    `fixtures/golden/README.md`.
  - Done when: **G1**.

## Phase 3: Design (Thu Oct 29)

Spec: [specs/design.md](specs/design.md). Decisions: D3.1 to D3.11.

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
  - Done when: golden project tracker produces a brief with zero mandatory issues.

- [ ] **DS4** Theme generator (90 min). Depends: DS3
  - `pnpm add culori` (add types if your editor wants them).
  - `src/stages/design/theme.ts`: brief to Theme, OKLCH targets from the spec,
    lightness nudged until contrast passes; entity sets; contrast table.
    THEME-001, 002, 004 with tests (THEME-003 lands with the apply step in Phase 6).
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
  - Done when: golden project tracker produces screens with zero mandatory issues.

- [ ] **DS8** Renderers (45 min). Depends: DS7
  - `02-design.md` as in the spec. Optional: `02-wireframes.html` (D3.6 D).
  - Done when: you can review any screen from the markdown alone.

- [ ] **DS9** Every golden idea (60 min). Depends: DS8
  - Run design for every golden flow set; tune prompts on all but client notes; save golden `02-*`.
  - Done when: **G2**, including at least one justified new component for the
    dashboard editor.

## Phase 4: Contracts (Fri Oct 30, morning)

Spec: [specs/contracts.md](specs/contracts.md). Decisions: D4.1 to D4.6.

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
  - Done when: golden project tracker produces a contract with zero mandatory issues.

- [ ] **C5** Renderer (30 min). Depends: C4
  - `03-contract.md` with paths from the conventions. Optional: `03-openapi.json`.
  - Done when: renders the golden project-tracker contract.

- [ ] **C6** Every golden idea (40 min). Depends: C5
  - Save golden `03-contract.json` for each.
  - Done when: **G3**.

## Phase 5: Reconciliation and freeze (Fri Oct 30, afternoon to night)

Spec: [specs/reconciliation.md](specs/reconciliation.md). Decisions: D5.1 to D5.5.

- [ ] **R1** Coverage matrix (60 min). Depends: C6, DS9
  - `src/stages/reconcile/matrix.ts`: `buildMatrix`, data resolution as in the spec.
  - Done when: tests on the golden project-tracker set; every row has screens
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
  - Done when: golden project tracker freezes.

- [ ] **R6** Seeded defects and every golden idea (60 min). Depends: R5
  - The three seeded defects from the spec as tests with recorded responses;
    then freeze every golden idea.
  - Done when: **G4**.

---

## Track B (optional, in parallel): backend template

Independent of Phases 1 to 5; it only touches `template/server`,
`template/package.json` and compose files. Run it in a second agent session on
a git worktree (`git worktree add ../weave-track-b -b track-b`) and merge
before Phase 6. Decisions: D6.1 to D6.10. If nobody runs it, it becomes the
first half of Phase 6.

- [ ] **B1** Auth spike (60 min): D6.4 A on Fastify with Drizzle and Postgres;
  fall back to B if it doesn't work in an hour. Done when: sign up, sign in,
  `me`, sign out work with curl against a local Postgres.
- [ ] **B2** Replace the Express starter in `template/server` with Fastify,
  Drizzle and Postgres (2 h). Done when: `pnpm --dir template nx serve server`
  (or a plain `tsx` script) answers `/api/health`.
- [ ] **B3** Backend kit utilities (3 h): the D6.6 set, each with a recipe file
  and `@invalidAlternative` tags, mirroring the frontend recipes. Done when:
  each utility has tests.
- [ ] **B4** A hand-written `Project` resource on the kit (2 h). Done when:
  tests pass for validation, auth rejection, user A versus user B isolation,
  and responses matching their schemas.
- [ ] **B5** Compose and scripts (2 h): D6.8, D6.9, D6.10. Done when:
  `pnpm deploy:up` starts postgres, runs migrations once, then api, web and
  Caddy; data survives `docker compose restart`.

---

## Phases 6 to 10 (milestones; expanded when Phase 5 closes)

Each phase starts with an **expand** task: read OPTIONS.md sections for the
phase, list the tasks in this file in the same format, then start.

- [ ] **P6** Scaffold and backend (Sat Oct 31). Decisions: D6.x, D9.1.
  Scaffold an app from `template/` with `generate.mjs`, apply the theme
  (`ts-morph` edits; THEME-003), generate `packages/contract`, Drizzle schema
  and CRUD from the frozen contract, spike the coding engine (D9.1), let the
  backend agent write only custom operations, run the code validators (D6.7).
  Gate **G5**.
- [ ] **P7** Frontend (Sun Nov 1). Decisions: D3.6 C, D3.7, D7.x.
  Prototype pages from `02-screens.json` with fixture data, build the new
  components in `web/app/components/`, wire the generated client and hooks,
  run rendered checks and the visual rubric. Gate **G6**.
- [ ] **P8** Tests and repair (Mon Nov 2). Decisions: D8.x.
  Playwright tests from the frozen flows (generated before P7's wiring if
  possible), API contract tests, triage, structured repair requests, bounded
  repairs; agents can't edit tests. Gate **G7**.
- [ ] **P9** Package, release, prove (Tue Nov 3). Decisions: D6.9, D10.1, D11.1, D1.10 B.
  Compose packaging, release script with PR and checks, deploy one app, full
  runs on the two end-to-end ideas, run dashboard. Gate **G8**.
- [ ] **P10** Demo and submit (Wed Nov 4). Decisions: D12.x.
  Record the demo (idea, flows, design, contract, generated app, a caught
  defect and its repair, tests green, release, live URL, the numbers); README
  with real metrics and stated gaps; submit in the evening. Gate **G9**.

## If a day slips, cut in this order

1. Wireframe HTML (D3.6 D) and the OpenAPI export
2. Visual rubric (keep the rendered code checks)
3. Muse Image moodboard (D3.3 C) if it was ever started
4. Parallel design and contracts (run them one after the other)
5. Second round of each reconciliation pass
6. The test repair loop (report failures instead)
7. Public deployment (keep compose and DEPLOY.md)

Never cut: schemas, validators, golden fixtures, the coverage matrix, the
template-based scaffold. They are what keeps the output from drifting, which
is the whole idea.

## Risks

| Risk                                                         | Mitigation                                                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Meta's API rejects a schema shape                            | F2 sanitizes and F4 smoke-tests every construct used; keep schemas flat                     |
| Credits run out                                              | Replay cache, golden fixtures for offline work, Spark by default, costs logged per call     |
| Design outputs too big or inconsistent                       | IA first, then per-screen nodes (D3.11 B); per-screen reruns                                |
| Phases 6 to 9 get one day each                               | Track B in parallel now; the contract compiler (C2) is reused as the backend generator      |
| `muse exec` doesn't run headless on WSL                       | D9.1 E: own tool loop by default; Muse Code only if its spike passes                        |
| Prompt tuning turns into validator weakening                 | AGENTS.md forbids it; rule changes go through you                                           |
