# 21 · DS7 IA and nodes stage

Phase 3 · 90 min · Depends: DS3, DS4, DS6 · Decisions: D3.11 B, D3.1 B ·
Spec: specs/design.md "Shape", "New components"; drafts `prompt-ia.md`,
`prompt-nodes.md`

## Goal

The design stage end to end: brief, theme, one IA call, one nodes call per
screen in parallel, assembly, whole-artifact validation with per-screen
reruns, the gap report, and `02-screens.json`.

## What this step does

1. **The design stage end to end**: brief (step 17), theme (step 18), then
   one model call for the information architecture, then one call per screen
   for its nodes, three at a time.
2. **Assemble and check the whole**: the IA plus all nodes become
   `02-screens.json`; the whole-artifact rules run; a screen with mandatory
   issues is redone alone (at most twice), not the whole design.
3. **Write the gap report**: every new component the design declared, with
   its reasons and screens, into the run and into a running log across runs,
   so the components asked for most become the design system's backlog.
4. **Render** the markdown (step 22).
5. **A test with a fake model** builds the fixture and shows one rerun.

After this step an idea becomes a validated, screen-by-screen design built
from the real design system.

## Implementation details

### 1. Prompts (`src/stages/design/prompt.ts`)

```ts
export function iaSystemPrompt(inv: Inventory, brief: Brief): string;   // templates, sectionKinds, density, dsSummary, newComponentBudget
export function iaUserMessage(scope: Scope, flows: Flows, brief: Brief): string;
export function nodesSystemPrompt(screenId: string, brief: Brief, inv: Inventory): string; // screenId, voice, density, dsSummary
export function nodesUserMessage(ia: Ia, screenId: string, flows: Flows, scope: Scope): string;
```

The nodes user message carries: the IA's screens list (ids, names, routes),
this screen's sections, the declared new components, the flow steps and
alternatives this screen serves (full step objects, so fields are visible),
and the scope vocabulary. Review both drafts against the schema.

### 2. `src/stages/design/stage.ts`

`runDesign(ctx)` in order:

1. `runBrief`, `runTheme` (steps 17, 18); skip each when its artifact exists
   and isn't stale.
2. `inv = await inventory()`; `schemas = schemasFor(inv)`;
   `dctx = { scope, flows, inventory: inv }`.
3. IA: `runSpecStage({ stage: 'ia', schema: schemas.Ia, validate: (ia) => validateIa(ia, dctx) })`.
4. Nodes: `pLimit(3)` over `ia.screens`: `runSpecStage({ stage: 'nodes:S03',
   schema: schemas.ScreenNodes, validate: (out) => validateScreenNodes(out.nodes, ia, dctx) })`.
   A failed screen throws `StageFailed`; collect failures and stop with all
   of them listed, not the first.
5. Assemble `screens = { ...ia, nodes: all nodes }`; `issues =
   validateScreens(screens, dctx)`. Mandatory issues whose `at` points into a
   screen (`S03…`) rerun that screen's nodes call with the issues appended
   as a fix-up round (reuse the runner with an initial issue list: add an
   optional `initialIssues` to `runSpecStage`); at most 2 reruns per screen.
   Issues without a screen (an unused new component) go to one IA fix-up
   round, then nodes for any new screens.
6. `writeArtifact(run, 'screens', screens, { stage: 'design', inputs: ['scope', 'flows', 'brief'] })`.
7. Gap report: `02-ds-gaps.json` = `newComponents.map(({ name, purpose,
   closestExisting, usedOn }) => …)` plus idea name and run id; append one
   JSON line per component to `.weave-cache/ds-gaps.jsonl`.
8. Render (step 22).

Rounds and costs are logged per sub-stage; `show` sums them under `design`.

### 3. Tests

`stage.test.ts` with a fake llm scripted from the reading-list fixtures
(brief, IA, nodes per screen): the assembled artifact equals the fixture;
a scripted whole-artifact failure on S02 causes exactly one rerun of
`nodes:S02`; the gap file lists the fixture's new component.

## Done when

```sh
pnpm weave run fixtures/ideas/freelancer-workspace.md --to design
```

produces `02-brief.json`, `02-theme.json`, `02-screens.json`, `02-ds-gaps.json`
with zero mandatory issues; `show` lists `design` with its rounds.

## Watch out

- Keep `p-limit` at 3; the API's rate limit is unknown and 429s cost time.
- The IA call's input includes the whole flows JSON; watch its token count
  in `events.jsonl`.
