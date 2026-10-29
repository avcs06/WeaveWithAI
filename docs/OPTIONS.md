# Implementation options

Every way to build each agent that came up across your spec (**Y**), the first
plan (**P**), the second response (**R2**) and the third (**R3**), plus a few
new ones. Tick what you want to keep, strike or delete what you don't, and
write changes in **Notes**.

How the coding agent reads this file: in a decision where nothing is ticked,
the option marked **(default)** applies. A ticked option overrides the default.
"Pick one" means tick a single box; "pick any" means tick all that apply.

## Where the proposals disagreed

| Topic                  | Y                                   | P                              | R2                                | R3                            | Default here                                            |
| ---------------------- | ----------------------------------- | ------------------------------ | --------------------------------- | ----------------------------- | ------------------------------------------------------- |
| Model access           | not set                             | Meta API + Muse Code           | Meta API, own tool loop           | Vercel AI SDK, any provider   | Meta API via `openai` SDK (D1.3); engine per D9.1       |
| Artifact schemas       | not set                             | zod                            | JSON Schema + Ajv + TypeBox       | zod                           | zod v4 (D1.2)                                           |
| Design components      | DS components, restyled             | DS components only             | DS components + scoped variants   | DS components only            | DS first, new components allowed with reasons (D3.1)    |
| Design restyling       | restyle if over 20% different       | tokens only                    | tokens, then scoped variants      | tokens only                   | tokens, then `look` variants (D3.4); 20% rule is C      |
| Design format          | not set                             | flat node list                 | screen/state spec + previews      | pages, sections               | screens, sections, nodes (D3.2)                         |
| Contract format        | not set                             | resource DSL                   | operations + rich semantics       | OpenAPI-like + DB tables      | domain model + operations, HTTP by convention (D4.1)    |
| Reconciliation         | two loops                           | coverage matrix, two loops     | ordered procedure, freeze         | one code differ               | one differ, run in R2's order, then freeze (D5.1)       |
| Validation error code  | not set                             | 400                            | not set                           | 422                           | 400, Fastify's default (D4.3)                           |
| Database               | SQL                                 | Postgres + Drizzle             | Postgres + Drizzle                | SQLite                        | Postgres + Drizzle (D6.3)                               |
| Auth                   | utilities                           | own sessions                   | Better Auth                       | JWT cookie                    | Better Auth after a spike, own sessions fallback (D6.4) |
| Proxy and TLS          | nginx + SSL scripts                 | Caddy                          | Caddy                             | none                          | Caddy (D6.8)                                            |
| Packaging              | one Dockerfile                      | compose, 4 services            | compose + one-shot migration      | compose, 1 service            | compose with migration service (D6.9)                   |
| Coding engine          | agents                              | Muse Code headless             | own tool loop                     | page-by-page generation       | own loop, spike Muse Code first (D9.1)                  |
| Test IDs               | added on request by testing agent   | from screen node IDs           | role and label locators first     | testid on every interactive   | IDs on every node, tests prefer role and label (D7.4)   |
| Git                    | commit, release, workflows, merge   | full PR flow                   | PR auto, merge explicit           | commit only                   | PR auto, merge and release on command (D10.1)           |
| Loop limit             | until satisfied                     | 3                              | 2                                 | 2                             | 3 drafting, 2 per reconciliation loop (D1.6)            |

---

## 0. Repository

### D0.1 Repository layout (pick one)

- [ ] **A. One repo: root agent, `template/`, `mcps/frontend/` (default) (Y).** Everything a
      coding agent needs is in one checkout; the template stays a standalone
      pnpm/Nx workspace that `cp -r` can copy; `mcps/frontend/` is shared by the agent and
      the template. Cost: two toolchains in one repo, kept apart on purpose.
      In place since 2026-10-28.
- [ ] **B. New agent repo, design system as a git submodule at `template/`.** The DS
      repo stays clean and publishable. Submodules add friction to every commit,
      and coding agents handle them poorly.
- [ ] **C. New agent repo that fetches the template at run time** (git clone or an
      npm package). Cleanest separation; every DS change needs a publish step.
- [ ] **D. Keep the DS at the root and add `agent/` inside.** Least moving, but the
      template's ESLint, Nx and tsconfig would govern the agent's code, and every
      generated app would need `agent/` excluded.

Why A: the generator's value is the tight loop between the DS, its MCP and the
stages. One repo keeps that loop fast this week; the template can be split
out later with `git subtree split` if you want to publish it alone.

Notes:

### D0.2 Name of the copy-source folder (pick one)

- [ ] **A. `template/` (default)**
- [ ] **B. `starter/`**
- [ ] **C. `boilerplate/`** (what `generate.mjs` calls it in its error message)

Notes:

### D0.3 How generated apps get the MCP (pick one)

- [ ] **A. Link and copy (default).** `template/tools/weave-design-system-mcp`
      is a symlink to `../../mcps/frontend`; `generate.mjs` copies through it, so each app
      gets a real, self-contained MCP. No template script changes. Tested.
- [ ] **B. Package dependency.** Template scripts import `weave-frontend-mcp`
      by name; this repo uses `link:../mcps/frontend`, generated apps a published package
      or `file:` path. Cleaner long term; more edits now, and a publish step.
- [ ] **C. Not shipped.** The orchestrator validates centrally; generated apps
      lose the AI-friendly MCP for future edits.

Notes:

### D0.4 GitHub repository name (pick one)

- [ ] **A. Keep `weave-design-system` for now (default).** Rename before submission.
- [ ] **B. Rename to `weave` now.** GitHub redirects the old URL.

Notes:

---

## 1. Orchestration and model layer

### D1.1 Orchestrator style (pick one)

- [ ] **A. Plain TypeScript state machine (default) (P, R2, R3).** Fixed stage
      order, checkpoints, resumable, debuggable; the model works only inside a stage.
- [ ] **B. A supervisor model decides what runs next**, like the product-manager
      profile in Meta's multi-agent cookbook. Flexible and impressive in a demo;
      non-deterministic, hard to debug, and costs a call per decision.
- [ ] **C. Muse Code workflows** (JavaScript workflow scripts). Meta tooling
      points; documented as rollout-gated and missing on Apple silicon.
- [ ] **D. Task board with comment threads** (the Hermes Kanban pattern). Every
      negotiation is durable and replayable; a lot of machinery for 7 days.

Notes:

### D1.2 Schema library for artifacts (pick one)

- [ ] **A. zod v4 (default) (P, R3).** Types and runtime checks in one place;
      `z.toJSONSchema` feeds structured output; the MCP already uses zod v4.
- [ ] **B. JSON Schema + Ajv, TypeBox for types (R2).** Standard JSON Schema
      first; Fastify-native if the backend uses TypeBox too.

Notes:

### D1.3 Model client (pick one)

- [ ] **A. `openai` npm SDK pointed at `https://api.meta.ai/v1` (default).** Meta
      documents this exact setup, with a TypeScript structured-output example.
- [ ] **B. Vercel AI SDK `generateObject` with an OpenAI-compatible provider (R3).**
      Nice ergonomics, provider swapping. Unverified: how it sends structured
      output to Meta's endpoint; check before choosing.
- [ ] **C. Raw `fetch`.** No dependency; you write retries and types yourself.

Notes:

### D1.4 How structured output is requested (pick one)

- [ ] **A. `response_format` JSON Schema, constrained decoding (default).** Output
      always parses; validators only check meaning.
- [ ] **B. One "submit" tool whose parameters are the schema.** Works on endpoints
      with tool calling but no JSON Schema mode.
- [ ] **C. Prompt for JSON, then parse and repair.** Avoid; this is the brittle
      path every proposal warned against.

Notes:

### D1.5 How a round's issues go back to the model (pick one)

- [ ] **A. Multi-turn (default) (P).** Keep the model's last JSON in the
      conversation, add "fix only these mandatory issues, return the full JSON".
- [ ] **B. Fresh call (R3).** Re-send the prompt plus the issue list; the model
      regenerates from scratch, which can fix one thing and break another.
- [ ] **C. Patch operations only.** The model returns changes by ID. Used for
      reconciliation (D5.4); heavier to implement for first drafts.

Notes:

### D1.6 Loop limits (pick one)

- [ ] **A. 3 drafting rounds, 2 per reconciliation loop, 2 per coding repair (default).**
- [ ] **B. 2 everywhere (R2, R3).** Cheaper; first drafts of big artifacts often
      need a third round.
- [ ] **C. Your numbers:** ___

Notes:

### D1.7 Questions the agents raise (pick one)

- [ ] **A. Autonomous.** Every question has a default answer that is used (R2:
      default minor decisions).
- [ ] **B. Always interactive.** The run pauses on any question.
- [ ] **C. Autonomous by default, `--interactive` pauses for blocking ones (default).**
      Blocking means the answer changes scope, permissions, business rules or
      data. Answers are saved to `input/answers.json` and reused on reruns.

Notes: C. Since 2026-10-29 (F11, user) the asking happens inside the stage
loop: after every round that produced new output, an interactive stage asks
the blocking questions not yet answered. Answers ride along with the next fix
if one happens and never force one; all of them are returned and saved to
`input/answers.json` with the question as asked, so the next stage and any
rerun see them as already given. Blocking narrowed 2026-10-29 (FL8, user): a
question is raised when the answer changes scope, permissions, business rules
or data; it is blocking only when a wrong default would make the app wrong
for its users, at most 5 per scope (SCOPE-003).

### D1.8 Model routing (pick one)

- [ ] **A. `muse-spark-1.3` for everything.**
- [ ] **B. Spark by default; `muse-wonder-1.0` for a round that failed twice (default) (P).**
- [ ] **C. B, plus `muse-spark-1.3-contributor` for development runs.** Much
      cheaper; Meta may train on everything sent, including your DS code and recipes.

Notes:

### D1.9 Replay cache (pick one)

- [ ] **A. On in development (default).** Identical requests return the recorded
      response; iterate on validators and renderers for free.
- [ ] **B. Off.**

Notes:

### D1.10 How a run is shown (pick any)

- [ ] **A. CLI output plus markdown renderings of each artifact (default now).**
- [ ] **B. A small dashboard reading `events.jsonl` (default for the demo, Phase 9).**
      Timeline, validator results, coverage matrix, screenshots.
- [ ] **C. HTML wireframes of the design spec** (see D3.6 option D).

Notes:

### D1.11 Model backends (pick any)

- [x] **A. Meta Model API (default).** `muse-spark-1.3` and `muse-wonder-1.0` as
      routed by D1.8. Paid from the $150 credits.
- [x] **B. Muse Glimmer on a Modal Dedicated Endpoint.** Modal runs
      `meta-models/Muse-Glimmer-30B` (SGLang, one H200, scale to zero) behind
      an OpenAI-compatible endpoint that supports `json_schema` output. Billed
      as GPU time, which the $100 Modal credits cover. A run the
      infrastructure partner can verify for the $10k "Best Build on Meta Open
      Weight Models" prize. Modal offers Muse Spark Open only as a Shared
      Endpoint, per token, and its dashboard says plan credits do not apply
      to Shared Endpoints, so that path is not used.
- [ ] **C. Meta open-weight models on own hardware.** The same models through a
      local OpenAI-compatible server (vLLM with a GPU; llama.cpp or Ollama on
      CPU for a small Glimmer). The development machine shows no GPU in WSL and
      has 15 GB RAM, so expect CPU speed; best effort.
- [x] **D. Muse Spark Open on Baseten.** Baseten's Model API
      (`https://inference.baseten.co/v1`), per token ($1.25 in, $0.15 cached,
      $4.25 out per 1M), paid from the $100 Baseten credits at up to 2M tokens
      a minute. The hackathon key may call only
      `meta-models/muse-spark-open-1026`. Baseten's docs say Spark Open there
      has no structured output, but F8's smoke test got every construct of
      the toy schema back valid, so the client needs no second output mode.

One client and one schema bridge serve all three; `LLM_BACKEND` picks the base
URL, key and model. Structured output (`response_format: json_schema`) is the
part that differs per server and is checked in F8.

Notes: A and B ticked on the user's instruction, 2026-10-28, to be eligible
for the open-weights prize. C was ticked by mistake and unticked on
2026-10-29: the user never meant to host a model; "local" meant the
generator on this machine calling the Model API, which is A. The same day,
on the user's instruction: B changed from a self-deployed vLLM app to a
Modal-managed endpoint (first Spark Open shared, then Glimmer dedicated once
the credits rule was clear), and D was added after Baseten granted credits.

### D1.12 Reviewer agents in the stage loop (pick one)

- [ ] **A. Validators only.** The loop of D1.5 and D1.6 as built in F6: a
      model-based review, if any, produces warnings and never blocks.
- [x] **B. A fixed four-round schedule with reviewer calls (user, 2026-10-29).**
      Round 1: generate, validate. Round 2: fix the mandatory issues, validate,
      then two reviewer calls. Round 3: fix the mandatory issues and the
      blockers, validate, then one reviewer call. Round 4: a final fix,
      validate, stop. A fix is skipped when there is nothing to fix, but the
      reviewer calls of that round still run; the stage ends as soon as a
      review finds nothing on validator-clean output, so a clean first draft
      costs one generation and two reviews. Whatever remains after round 4
      is recorded as known issues (mandatory and blockers) and the run
      continues to the next stage; the stage does not fail. A reviewer gets
      the generator's full prompt (system and user messages), the JSON it
      produced, the validator warnings as already known, and the stage's
      review guide (what to look for, what to ignore); nothing else. It
      answers through one shared review schema, different from the stage
      schema, listing major blockers only, which become mandatory issues for
      the next fix. Reviewers ignore minor, no-impact and low-impact problems,
      rare edge cases and non-ideal scenarios; each stage's guide says which
      scenarios count. Reviewers use the default model; the strong-model
      escalation of D1.8 applies to the generator from round 3.

Notes: B on the user's instruction, 2026-10-29, revised the same day from a
"gate the stage" version to the fixed schedule. It replaces the AGENTS.md rule
that model review only produces warnings, D1.6's 3 drafting rounds (now 4 for
spec stages) and the principle that leftover blockers stop the run. Worst
case per stage: four generator calls and three reviewer calls. From round 2
on, validation and review look at the same output, whatever the validators
found: a heuristic, not a gate (user, 2026-10-29).

### D1.13 Output budget and reasoning effort (pick one)

Meta's models reason before they answer; the reasoning tokens count toward
`max_tokens` and are billed as output (docs, 2026-10-29). The first flows run
was cut at 16k tokens, and each reviewer's empty verdict cost about 8k
reasoning tokens.

- [x] **A. Per-stage budgets, reviewers at medium effort (user, 2026-10-29).**
      The generator keeps the model's own reasoning level with a budget per
      stage (scope 16k, flows 32k, doubled once when the answer is cut, capped
      at 64k). Reviewers run at `reasoning_effort: medium` with an 8k budget:
      they return a short list, so most of their tokens are reasoning, and
      medium keeps the verdict considered without the model-determined cost.
- [ ] **B. Low effort everywhere.** Cheapest; first drafts of big artifacts
      lose quality.
- [ ] **C. Your levels:** ___

Notes: A ticked by the user on 2026-10-29, raised from the proposed low to
medium.
The flows generators also run at medium since the same night: at the
model's own level the catalog call wrote 27k characters of JSON and was still
cut at 32k tokens, two thirds of the budget being reasoning. Scope keeps the
model's own level. Catalog budget 32k, batches and patches 16k.

---

## 2. User flow agent

### D2.1 Generation shape (pick one)

- [ ] **A. One call: idea to flows (R3).** Cheapest; misses coverage on larger
      ideas; no point to answer questions before flows get written.
- [ ] **B. Two calls: scope, then flows (default) (R2).** Scope fixes roles,
      vocabulary, capabilities, assumptions and questions; flows build on it.
- [ ] **C. Catalog, then expand each flow in parallel.** Scales to big apps;
      needs a consistency pass because flows written apart drift on field names.
- [x] **E. Scope, then three flows stages (user, 2026-10-29).** A catalog
      stage writes every flow's header and description plus the reusable
      parts (fields defined once, forms, subflows), assumptions and
      questions. An expansion stage splits the flow ids into batches, each a
      stage of its own run in parallel, expanding its flows while reusing the
      parts by name. A reconciliation stage starts from the assembled draft
      without a first generation: it validates the whole document with every
      rule and fixes by patches (flows and parts that change); no reviewers,
      the batches were reviewed already.
      Names cannot drift because every reusable part is defined once.

Combine with (pick any):

- [ ] **D. Critic pass.** A reviewer call lists flows a typical user would expect
      but are missing; findings become warnings or a revision round.

Notes: E on the user's instruction, 2026-10-29, after B failed on the
freelancer workspace: the one-call flows document passed 83k characters and
was still unfinished at a 64k-token budget, three attempts costing about $1.
The reviewer calls of D1.12 replace the critic pass D.

### D2.2 Step granularity (pick one)

- [ ] **A. Paired steps (default) (R2, R3).** Each step = what the user does +
      what the website visibly does. Reads like your example.
- [ ] **B. Separate user and system steps (P).**
- [ ] **C. Numbered free text with light structure.** Most natural to read,
      weakest for validation and test generation.

Notes:

### D2.3 Form field detail (pick one)

- [ ] **A. Full (default) (R2).** Name, label, business meaning, type, required,
      limits, options, example.
- [ ] **B. Minimal (R3).** Name, type, required.

Notes: A, with three changes on 2026-10-29 (FL9): fields are defined once in
a catalog at the document level with ids FD01, FD02, ... and steps and forms
refer to them by id; fields carry no technical name, so the contract stage
chooses names freely from label and meaning (user); and the four limit keys
become two, `min` and `max`, read as lengths for text types and as values
for numbers.

### D2.4 Alternative paths (pick one)

- [ ] **A. Required where they apply (default) (R2).** Invalid input and failure
      for submissions, empty for lists, confirm or undo for deletes, denied for
      restricted actions, cancel for forms.
- [ ] **B. Optional.**

Notes:

### D2.5 Capability boundary (pick one)

- [ ] **A. Capability list in the prompt (default) (R2).** Unsupported needs
      (payments, uploads, email, realtime, maps, external APIs) go to
      out-of-scope with a placeholder behavior.
- [ ] **B. No boundary.** The flows describe whatever the idea implies.
- [x] **C. Three modes, no whitelist (user, 2026-10-29).** The app builds
      whatever the idea needs. The list in `src/config/capabilities.ts` only
      names the exceptions: simulated capabilities get their full UI with a
      placeholder effect written in the list itself (payments: the checkout
      validates and shows success, nothing is charged; fileUploads: the file
      is validated and previewed, nothing is stored; emailSending: the
      website shows the email as sent), and skipped capabilities (realtime,
      maps, externalIntegrations, multiTenant, i18n) go to out-of-scope with
      a placeholder as in A. The ids stay an enum in the scope schema.

Notes: C on the user's instruction, 2026-10-29. multiTenant could run on
mock data but stays skipped to save credits; realtime and maps likewise.

### D2.6 Data effects on steps (pick one)

- [ ] **A. Each step names the nouns it creates, lists, reads, updates or deletes
      (default).** Plain business terms, no endpoints. Lets contracts map steps
      to operations by code.
- [ ] **B. Leave effects out**, keeping flows purely behavioral as in your spec;
      the contract agent infers them.

Notes:

### D2.7 Banned vocabulary (pick one)

- [ ] **A. Technology words mandatory, layout words warning (default).** "API",
      "endpoint", "database", HTTP verbs fail; "sidebar", "modal", "left"
      warn. "Page", "screen" and "clicks" stay allowed, as in your example.
- [ ] **B. Both mandatory.**
- [ ] **C. No word checks.**

Notes:

---

## 3. Design agent

### D3.1 Component policy (pick one)

- [ ] **A. DS components only (P, R3).** You ruled this out: the DS doesn't cover
      every scenario yet.
- [ ] **B. DS first; new components allowed with reasons (default, your pointer).**
      The prompt shows the inventory as inspiration and strongly prefers it. A
      screen may use a new component only if it's declared with purpose, the
      closest DS components considered and why they don't fit, parts, states,
      keyboard map and ARIA pattern. Exact or near duplicates of DS components
      fail or warn. Each run writes a DS gap report of proposed components.
- [ ] **C. Design freely, then map to the DS.** The agent designs without seeing
      the inventory; a mapping pass picks DS components and turns the rest into
      new ones. Most original look; more reconciliation work.

Notes:

### D3.2 Design representation (pick one)

- [ ] **A. Section level (R3).** Pages, then sections with a type, components
      used, primary action and fields. Easy for the model; renderer decides details.
- [ ] **B. Flat node list per screen (P).** Every element is a node with a
      component, props, role, states, flow steps and data. Directly renderable;
      big outputs.
- [ ] **C. Screens, then typed sections, then nodes (default).** Sections carry
      intent (hero, form, list, detail), nodes carry components and coverage.
- [ ] **D. Code first (R2's "use the actual components from the beginning").** The
      agent writes prototype pages in TSX; specs are read from annotations.
      Strongest fidelity, weakest structured validation.
- [ ] **E. Image first.** Muse Image draws mockups; a vision call extracts
      layout and colors into a spec. Strong demo and Meta tooling; least control.

Notes:

### D3.3 Theme generation (pick one)

- [ ] **A. The model writes every color**, a validator checks contrast and asks
      for fixes. Simple; 24+ hex values per theme invite contrast failures.
- [ ] **B. The model picks a seed hue, mood, density, fonts, radius and focus ring;
      code builds the palette (default).** OKLCH steps map onto the DS's 12
      color roles in light and dark, nudged until WCAG contrast passes.
- [ ] **C. B, seeded by a Muse Image moodboard.** Dominant colors from the image
      seed the palette; the moodboard also serves as hero art.
- [ ] **D. The user supplies brand colors**; code fills the rest as in B.

Notes:

### D3.4 Customization policy, your "20% rule" (pick one)

- [ ] **A. Tokens only (R3).** Theme colors, entity colors, radius, fonts, focus
      ring. A validator rejects any other change to DS files.
- [ ] **B. Tokens, then existing variants and `look` tokens, then a new scoped
      `look` value when nothing fits (default) (R2).** Behavior, keyboard handling
      and structure never change; component checks rerun after style changes.
- [ ] **C. Your rule, made measurable.** Per component, compare these design-intent
      properties with the component's defaults: radius step, padding step, height
      step, border weight, shadow level, font weight, color role. If at least 20%
      of the compared properties differ, add a `look` value for that component
      (never edit base styles). Gives "20%" a denominator.
- [ ] **D. Free restyling of component styles (Y original).** Most freedom; can
      break the accessibility and focus work the DS guarantees.

Notes:

### D3.5 Layout vocabulary (pick one)

- [ ] **A. Layout templates plus section kinds (default).** Templates such as
      app-shell list, detail, form, auth, landing, dashboard, editor, settings.
- [ ] **B. Free nested containers with layout properties.**

Notes:

### D3.6 Rendering the design (pick any)

- [ ] **A. No rendering until the frontend stage (R3).**
- [ ] **B. Deterministic renderer:** spec to pages through one small adapter per DS
      component (P). Hard for components whose props are code (Table columns,
      render props).
- [ ] **C. The model writes prototype pages from the spec, using recipes; checked
      by MCP validate, typecheck and `pnpm verify` (default for Phase 7).** Builds
      new components for real.
- [ ] **D. HTML wireframe preview:** labeled boxes per section and node, no DS
      (default for Phase 3, optional task). Cheap human review and demo material.

Notes:

### D3.7 Design validation layers (pick any)

- [ ] **A. Static spec rules (default, Phase 3).** Coverage, states, focal points,
      density, headings, labels, reachability, DS prop values, new-component rules.
- [ ] **B. Rendered checks on prototypes (default, Phase 7).** axe, contrast,
      keyboard walk, target size, overflow, above-the-fold action.
- [ ] **C. Visual rubric by a vision model on screenshots (default, Phase 7,
      warnings only).**

Notes:

### D3.8 Visual rubric scale (pick one)

- [ ] **A. 0 to 4 per concern with evidence (screen, element, reason); average 3+
      as a tuning target (default) (R2).**
- [ ] **B. One 0 to 100 score, pass at 70 (R3).**

Notes:

### D3.9 Viewports for rendered checks (pick one)

- [ ] **A. 320, 390, 768, 1440 (R2).**
- [ ] **B. 320, 375, 1280: what `template/tools/verify.mjs` already uses (default).**
- [ ] **C. B plus 768.**

Notes:

### D3.10 Where new components live in a generated app (pick one)

- [ ] **A. `web/app/components/<Name>/` following the DS conventions (default):**
      types file, `.css.ts` with tokens, `data-slot` parts, `data-*` states,
      a test with axe.
- [ ] **B. Added to `packages/ui` inside the generated app.**
- [ ] **C. A, and the gap report proposes them back to your DS.**

Notes:

### D3.11 How screens are generated (pick one)

- [ ] **A. One call for every screen, section and node.** Simplest; large
      outputs (300 nodes is about 30k output tokens) and one bad screen reruns all.
- [ ] **B. One call for the information architecture (navigation, screens,
      sections, new components), then one call per screen for its nodes, 2 to 4
      in parallel (default).** Smaller calls, per-screen validation and reruns.

Notes:

---

## 4. Contract agent

### D4.1 Contract representation (pick one)

- [ ] **A. Resource DSL (P).** Entities plus endpoints with a kind (list, get,
      create, update, delete, action); code derives everything else.
- [ ] **B. Operations with schemas and access policies (R2).**
- [ ] **C. OpenAPI 3.1 + database tables written by the model (R3).** Standard
      and tool-rich; the largest surface for model mistakes.
- [ ] **D. Domain model + operations; HTTP shape by convention (default).** Merges
      A, B and C: the model decides meaning (entities, fields, ownership,
      operations, errors), code decides paths, status codes and wire format, and
      can still export OpenAPI.

Notes:

### D4.2 What the contract decides (pick any)

- [ ] **A. Entities, relations, lifecycle states (default)**
- [ ] **B. Field semantics: required, nullable, limits, enums, defaults (default)**
- [ ] **C. Operations including list filters, sorting and pagination (default)**
- [ ] **D. Errors per operation (default)**
- [ ] **E. Authentication and authorization per operation (default)**
- [ ] **F. Server-assigned versus client-supplied fields; sensitive fields (default)**
- [ ] **G. Seed data plus invalid and boundary examples (default)**
- [ ] **H. Transactions for multi-entity writes (default, warning only)**
- [ ] **I. Idempotency for retries and double submits** (R2; not default)
- [ ] **J. Concurrency: version checks on update** (R2; not default)

Notes:

### D4.3 Validation error status (pick one)

- [ ] **A. 400 (default).** What Fastify returns for schema failures.
- [ ] **B. 422 (R3).**

Notes:

### D4.4 Pagination (pick one)

- [ ] **A. Page and page size with a total (default).** Matches the DS
      `Table.Pagination`.
- [ ] **B. Cursor (P).** Matches `Table.InfiniteScroll`; no page numbers.

Notes:

### D4.5 Record IDs (pick one)

- [ ] **A. UUID (default)**
- [ ] **B. Auto-increment integers**

Notes:

### D4.6 Semantic reviewer (pick one)

- [ ] **A. Off (default).** Screen-data coverage is checked by code in reconciliation.
- [ ] **B. On, warnings only:** "does each operation give the flow what it needs?"

Notes:

---

## 5. Reconciliation

### D5.1 Structure (pick one)

- [ ] **A. Your two loops (Y, P).** Design with flows first; contract with design
      only after design is final.
- [ ] **B. One code differ, mismatches routed to the owner (R3).**
- [ ] **C. R2's ordered procedure with a freeze.**
- [ ] **D. B's differ run in C's order (default).** Pass 1 reconciles flows and
      design; if flows changed, the contract is refreshed; pass 2 reconciles
      design data and actions with the contract; then everything freezes. Your two
      loops become two passes of one differ.

Notes:

### D5.2 Business-rule gaps (pick one)

- [ ] **A. A contract gap that is a missing business rule goes to the flow agent
      as a question (default) (R2).** Example: a screen shows "available slots"
      but no flow says what makes a slot available.
- [ ] **B. The contract agent invents the rule and records it as an assumption.**

Notes:

### D5.3 Source of truth when artifacts disagree (pick one)

- [ ] **A. Flows own business meaning; design owns presentation; the contract owns
      technical shape (default).**
- [ ] **B. Your call per conflict, in interactive mode.**

Notes:

### D5.4 Change format (pick one)

- [ ] **A. Regenerate the whole artifact with the issues.** Simplest; unrelated
      parts can drift.
- [ ] **B. Typed upserts and removals by ID (default).** Unchanged items stay
      byte-identical.
- [ ] **C. JSON Patch (RFC 6902).** Standard; path mistakes are common.

Notes:

### D5.5 Unresolved blockers after the last round (pick one)

- [ ] **A. Stop and report the exact issues (default) (R2).**
- [ ] **B. Continue with warnings.**
- [ ] **C. Ask you interactively.**

Notes:

---

## 6. Backend agent (parked 2026-10-28)

Parked on the user's instruction: this week has no backend agent. Section 6M
below replaces it with a mock API inside the generated app. The decisions here
stay for after the hackathon; a real backend replaces the mock behind the same
typed client.

### D6.1 Server framework (pick one)

- [ ] **A. Fastify (default) (P, R2, R3).** Schema validation, plugins, `inject` for tests.
- [ ] **B. Express**, which `template/server` uses today.

Notes:

### D6.2 Request and response schemas (pick one)

- [ ] **A. Zod (default).** One schema language for agent, frontend and backend.
- [ ] **B. TypeBox (R2).** Fastify-native JSON Schema.

Notes:

### D6.3 Database (pick one)

- [ ] **A. Postgres + Drizzle (default) (P, R2).**
- [ ] **B. SQLite + Drizzle (R3).** Simplest demo, one container.
- [ ] **C. Drizzle with both dialects**, SQLite for dev and tests, Postgres in Docker.

Notes:

### D6.4 Authentication (pick one)

- [ ] **A. Better Auth (default, after a 1-hour spike) (R2).** Established library;
      documented Fastify integration and a Drizzle adapter (verify both).
- [ ] **B. Own sessions: argon2 hashes, sessions table, httpOnly cookie (P).**
      About 150 lines you control.
- [ ] **C. JWT in an httpOnly cookie (R3).** Simple; no server-side revocation.

Notes:

### D6.5 How backend code gets written (pick one)

- [ ] **A. A generator writes CRUD from the contract; the agent writes only custom
      operations (default) (P).**
- [ ] **B. The agent writes every resource with the utilities (R3).**
- [ ] **C. The agent writes freely, then validators check it.**

Notes:

### D6.6 Utility set (pick any; names are proposals)

- [ ] **A. `createServer`**: compression, static, redirects, error envelope, health, shutdown (P, Y)
- [ ] **B. `defineOperation` / `defineResource`**: register routes from the contract (R2, P)
- [ ] **C. Auth adapter**: current user, `requireAuth`, `requireRole` (all)
- [ ] **D. Scoped repository**: owner filter on every read and write (R2)
- [ ] **E. Pagination helper**: bounded limits, allowed sort and filter fields (R2)
- [ ] **F. Transaction helper** (R2)
- [ ] **G. Errors**: `badRequest`, `notFound`, `conflict`, `forbidden` (P, R3)
- [ ] **H. Config loader**: validated env at startup (R2)
- [ ] **I. Logging and health**: request IDs, redaction, liveness, readiness (R2)
- [ ] **J. DB scripts**: start, create user, migrate, seed, backup, restore (Y)

All ticked by default.

Notes:

### D6.7 Utility-usage validator (pick one)

- [ ] **A. ESLint restricted imports and syntax plus a `ts-morph` check, rules
      generated from `@invalidAlternative` tags on the utilities (default) (P, R2, Y).**
- [ ] **B. Regex over generated files (R3).**

Notes:

### D6.8 Proxy and TLS (pick one)

- [ ] **A. Caddy, automatic HTTPS (default) (P, R2).**
- [ ] **B. nginx with certificate scripts (Y).**
- [ ] **C. None; the app serves HTTP and the host handles TLS (R3).**

Notes:

### D6.9 Packaging (pick one)

- [ ] **A. Compose: postgres, one-shot migrate, api, web, caddy (default) (R2).**
- [ ] **B. Compose with one app service and SQLite (R3).**
- [ ] **C. One image running everything under a process manager (Y).**

Notes:

### D6.10 Command interface in generated apps (pick one)

- [ ] **A. Fixed pnpm scripts (default) (R2):** `setup`, `dev`, `check`,
      `test:api`, `test:e2e`, `deploy:up`, `deploy:status`, `db:backup`, `db:restore`.
- [ ] **B. Your list:** ___

Notes:

---

## 6M. Mock data and API (Phase 6, replaces the backend for now)

Added 2026-10-28. The frozen contract is compiled into the generated app by
code: types, a typed client, hooks, seed data and a mock API. No model calls.

### D6M.1 Mock API shape (pick one)

- [x] **A. Next.js route handlers generated from the contract, backed by a JSON
      file (default; user, 2026-10-28).** One `route.ts` per path from the
      contract conventions (`web/app/api/<kebab-plural>/…`), validation with the
      compiled zod schemas, the real error envelope and status codes. Data lives
      in `web/mocks/db.json`: a create adds a row to the file. Real HTTP, so the
      typed client, the e2e tests and the benchmark all exercise the same path a
      backend will later serve.
- [ ] **B. In-browser store** (`createStore` from `@packages/utils/state` plus
      `localStorage`), hooks call it directly. No HTTP, nothing for Lighthouse
      or Playwright to see on the network; swapping in a backend rewrites the
      hooks.
- [ ] **C. Mock Service Worker (MSW)** intercepting `fetch` in the browser.
      Real-looking requests; data is per tab and gone on reload unless persisted.

Notes:

### D6M.2 Persistence and reset (pick one)

- [x] **A. `web/mocks/seed.json` (pristine, from the contract's seed rows and a
      demo user) and `web/mocks/db.json` (live) (default; user, 2026-10-28).**
      `pnpm mock:reset` copies seed over db. The store serializes writes
      through one promise queue and writes atomically (temp file, rename).
      `MOCK_DB_PATH` points tests and benchmarks at their own copy.
- [ ] **B. In-memory only**, reseeded on every server start.

Notes:

### D6M.3 Auth in the mock (pick one)

- [x] **A. Session cookie (default; user, 2026-10-28).** `POST /api/auth/sign-up`,
      `sign-in`, `sign-out` and `GET /api/auth/me` from the conventions; users
      in the store with a salted SHA-256 `passwordHash` (a mock, not for
      production); an httpOnly `weave_session` cookie holding a session id;
      `owner` access filters by `ownerId`; `role` access checks `user.role`.
- [ ] **B. No auth**: every request runs as the demo user. Simpler; the auth
      flows and the denied alternatives can't be tested.

Notes:

### D6M.4 Latency and failure simulation (pick one)

- [x] **A. Configurable (default; user, 2026-10-28).** `MOCK_LATENCY_MS` (150 in
      `pnpm dev`, 0 under tests and benchmarks) so loading states are visible;
      a request header `x-mock-fail: <code>` forces that error, which the e2e
      tests use for the failure alternatives through `page.route`.
- [ ] **B. None.**

Notes:

---

## 7. Frontend agent (Phase 7)

### D7.1 Approach (pick one)

- [ ] **A. Prototype pages from the design, then wire data (default) (P).**
- [ ] **B. Page by page straight from the design spec (R3).**
- [ ] **C. The whole app in one coding session.**

Notes:

### D7.2 Data layer (pick one)

- [ ] **A. A typed client and TanStack Query hooks generated from the contract (default).**
- [ ] **B. Hand-written calls through the template's `Server` helper.**

Notes:

### D7.3 Test IDs and locators (pick one)

- [ ] **A. `data-testid` from the node ID on every node; tests use it (P, R3).**
- [ ] **B. Role and label locators; test IDs only where those are ambiguous (R2).**
- [ ] **C. IDs on every node, tests prefer role and label and fall back to the ID (default).**

Notes:

### D7.4 Frontend validators (pick any)

- [ ] **A. `tsc` (default)**
- [ ] **B. MCP `validate` on every changed file (default)**
- [ ] **C. Template ESLint, including import direction and Tailwind policy (default)**
- [ ] **D. `next build` (default)**
- [ ] **E. `pnpm verify <route>` for runtime errors and overflow (default)**

Notes:

---

## 8. Testing agent (Phase 8)

### D8.1 When acceptance tests are made (pick one)

- [ ] **A. From the frozen flows, before implementation (default) (R2).** Tests
      can't drift toward whatever got built.
- [ ] **B. After implementation.**

Notes:

### D8.2 How tests are written (pick one)

- [ ] **A. Code generates one Playwright test per flow from steps, fields and node
      IDs; the model only turns outcomes into assertions (default) (P).**
- [ ] **B. The model writes specs from the flows and a list of test IDs (R3).**

Notes:

### D8.3 Failure routing (pick one)

- [ ] **A. Evidence table (P) plus structured repair requests (R2) (default).**
      Missing element goes to frontend; 5xx or a response failing its schema goes
      to backend; each request names flow, operation, rule, expected, actual, evidence.
- [ ] **B. A model triages each failure.**

Notes:

### D8.4 Extra backend checks (pick any; this week they run against the mock API, S4)

- [ ] **A. Unauthenticated access rejected (default)**
- [ ] **B. User A can't touch user B's records (default)**
- [ ] **C. Responses match the contract schemas (default)**
- [ ] **D. Data survives a restart (default)**
- [ ] **E. Forced mid-transaction failure leaves no partial write**
- [ ] **F. Migrations run twice safely**
- [ ] **G. No secrets or stack traces in responses and logs**

Notes:

---

## 9. Coding engine for code-writing stages (Phase 6 onward)

### D9.1 Engine (pick one)

- [ ] **A. Muse Code headless (`muse exec --json --prompt-file`) (P).** Skills from
      your recipes, hooks running MCP validate per edit, subagents. Most Meta
      tooling; less control; its Linux sandbox needs bubblewrap.
- [ ] **B. Own tool loop on the Meta Model API (R2).** Tools: read file, write
      file, apply patch, run an allowed check. Full control of file ownership and
      logs; you build the loop (about 200 lines).
- [ ] **C. OpenCode `opencode run` with the Meta provider**, as in Meta's cookbook.
- [ ] **D. Structured file generation:** the model returns whole files for a
      listed set (R3's page-by-page). No tools; best for small, independent files.
- [ ] **E. B as the default, D for single new files, after a 1-hour spike of A
      (default).** Switch to A if the spike shows headless runs work with your
      skills, hooks and MCP on WSL.

Notes:

---

## 10. Git agent (parked 2026-10-28)

Parked with deployment. The generator commits nothing this week; the user
commits generated apps by hand if needed.

### D10.1 What the script does (pick one)

- [x] **A. Commit only (R3) (user, 2026-10-28: parked, nothing automated this week).**
- [ ] **B. Commit, push, PR, wait for checks, merge, tag, release (P, Y).**
- [ ] **C. B up to a passing PR; merge and release on an explicit command (R2).** Was the default; parked.

Notes:

---

## 11. Deployment target (parked 2026-10-28)

### D11.1 Where the demo app runs (pick one)

- [ ] **A. Local compose plus one VM with a domain for the demo.** Was the default; parked.
- [x] **B. Local only (user, 2026-10-28).** The benchmark's production server
      (`next build` and `next start`) is the closest thing to a deployment this week.
- [ ] **C. A platform (Fly.io, Render, Railway).**

Notes:

---

## 12. Demo and evaluation

### D12.1 Reference ideas (pick any)

- [x] **A. Freelancer workspace: development idea, end to end (user, 2026-10-29).**
      Project tracker, client notes and appointment booking merged into one
      brief: clients with notes and follow-ups, projects with tasks, a public
      booking page. Also the business-rule stress test (slot availability).
- [x] **B. Dashboard editor (your widget example): new-component stress test, planning stages (user, 2026-10-29).**
- [x] **C. Ecommerce store: unseen test, then end to end (user, 2026-10-29).**
      Each planning stage runs it once untuned and records the result; after
      that it joins tuning so it reaches the second end-to-end run (G8).

Notes:

- 2026-10-29: three ideas, none of them simple. The earlier four (project
  tracker, client notes, dashboard editor, appointment booking) are replaced
  by the three above. Descope to fewer ideas only if time runs out.

### D12.2 What the demo measures (pick any)

- [ ] **A. Complete runs / attempted runs (default)**
- [ ] **B. Flows passing e2e / flows in scope (default)**
- [ ] **C. Checks passing before repair, and repairs that succeeded (default)**
- [ ] **D. Share of code written by generators versus models (default)**
- [ ] **E. Time, model calls, tokens and cost per run (default)**
- [ ] **F. Remaining warnings and known gaps, stated plainly (default)**
- [x] **G. The benchmark table per generated app (user, 2026-10-28).** Every
      number from section 13, before and after repairs.

Notes:

---

## 13. Benchmark (Phase 8)

Added 2026-10-28 on the user's instruction: after a website is generated, one
run measures every frontend quality concern and writes one table. Thresholds
are reported, never looped on by the model; repairs come from the tests.

### D13.1 What is measured (pick any; all ticked by the user, 2026-10-28)

- [x] **A. Performance: Lighthouse 13** through its Node API on Playwright's
      Chromium, mobile and desktop presets, per route, signed in by cookie.
      Scores (performance, accessibility, best practices, SEO), LCP, FCP, CLS,
      TBT, Speed Index, total bytes, unused JavaScript, DOM size.
- [x] **B. Accessibility: axe-core** (`@axe-core/playwright`, WCAG 2.2 AA tags)
      per route and state, violations by impact; computed-style contrast and
      target size from the FE5 collectors.
- [x] **C. Screen reader:** the accessibility tree per route (Playwright
      `ariaSnapshot`) scored for unnamed controls, landmarks, heading outline,
      labelled fields, dialog naming and focus, live regions; plus a virtual
      screen reader pass (`@guidepup/virtual-screen-reader`) whose spoken
      phrase log is saved per route.
- [x] **D. Keyboard navigation:** a Playwright Tab walk per route: reachable
      controls, visible focus, order against reading order, traps, Escape on
      dialogs, Enter and Space on controls, skip link.
- [x] **E. Duplicate implementations:** jscpd clones and duplicated percentage
      over `web/app`; design-system duplicates: MCP `invalid-alternative`
      findings (hand-built elements the DS has), new components whose names are
      within edit distance 2 of a DS component, native controls rendered inside
      new components, data access outside `entities`, the same component name in
      two route folders.
- [x] **F. Code quality:** tsc errors, ESLint findings by rule, MCP validate
      findings by rule, knip unused files, exports and dependencies, first-load
      JavaScript per route (gzip) from the build manifests, lines of code by
      origin (template, codegen, model, repair) from the ledger.

Notes:

### D13.2 Production server for the measurements (pick one)

- [x] **A. `next build` then `next start` (default; user, 2026-10-28).** Next's
      server gzips responses (`compress: true`), sets ETags and immutable
      caching for `/_next/static`; the template's `next.config.js` adds security
      headers. The runner asserts `content-encoding: gzip` before measuring.
- [ ] **B. A Node reverse proxy with Brotli** (`compression` or a Caddy
      container in front of `next start`). Better compression numbers; one more
      process to manage.

Notes:

### D13.3 Thresholds (reported as pass, warn or fail; pick one)

- [x] **A. Defaults (user, 2026-10-28):** Lighthouse performance 90 (desktop)
      and 80 (mobile), accessibility 100, best practices 90, SEO 90; axe serious
      and critical 0; contrast failures 0; unnamed controls 0; keyboard
      reachability 100% and visible focus 100%, no traps; jscpd duplication
      under 3% and no clone over 30 lines; DS duplicates 0; tsc and MCP errors
      0; first-load JS under 250 KB gzip per route.
- [ ] **B. Your numbers:** ___

Notes:

### D13.4 When it runs (pick one)

- [x] **A. After `frontend` and again after `repair` (default; user, 2026-10-28)**,
      plus `weave bench <runId>` by hand. The second table shows deltas.
- [ ] **B. Only by hand.**

Notes:

### D13.5 Routes and states measured (pick one)

- [x] **A. Every page screen, signed in as the demo user, default state; the
      empty state through a second user with no rows (default; user, 2026-10-28).**
- [ ] **B. Entry pages only.**

Notes:
