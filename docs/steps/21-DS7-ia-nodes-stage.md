# 21 · DS7 IA and nodes stage

Phase 3 · 90 min · Depends: DS3, DS4, DS4a, DS6, DS12, DS13 · Decisions:
D3.11 B, D3.1 B, D1.12, D1.13 C · Spec: specs/design.md "Shape", "Theme",
"Screens", "Validator rules"; prompts `prompt-ia.md`, `prompt-nodes.md` and
their `-input.md` messages (written in DS7e)

## Goal

The design stage end to end: brief, theme, one IA call, one nodes call per
screen and per used shell in parallel, assembly, whole-artifact and layout
validation with each issue sent back to the call that owns it, the gap
report, and `02-screens.json`.

## What this step does

1. **The design stage end to end**: brief (step 17), theme (step 18), then
   one model call for the information architecture, then one call per screen
   and per used shell for its nodes, three at a time. Every call runs the
   stage loop of D1.12 at temperature 0.2; the IA at high reasoning, the
   nodes calls at medium; the brief runs at high, its first draft at 0.7.
2. **Assemble and check the whole**: `resolveScreens` turns the IA, the
   theme and all nodes into `02-screens.json`; the whole-artifact rules run,
   the skeleton is solved and the layout rules run on it. Each issue goes
   back to the call that owns the value (DS12); what is left after that
   call's rounds is recorded as known issues, and the run goes on.
3. **Write the gap report**: every new component the design declared, with
   its reasons and screens, into the run and into a running log across runs,
   so the components asked for most become the design system's backlog.
4. **Render** `02-design.md` (step 22) and `02-wireframes.html`.
5. **A test with a fake model** builds the fixture and shows one rerun.

After this step an idea becomes a validated, screen-by-screen design built
from the real design system.

## Implementation details

### 1. Prompts (`src/stages/design/prompt.ts`)

```ts
export function iaSystemPrompt(brief: Brief, inv: Inventory): string;   // density, sectionKinds, dsProse, newComponentBudget
export function iaUserMessage(scope: Scope, flows: Flows, brief: Brief, layouts: Layouts): string;
export function nodesSystemPrompt(id: string, brief: Brief, inv: Inventory): string; // screenId, voice, density, dsProse
export function nodesUserMessage(id: string, ia: Ia, shells: Shell[], flows: Flows, scope: Scope, theme: Theme): string; // target, ia, steps, vocabulary, and DS13's look
```

`sectionKinds` goes in its own block, one kind per line. `dsProse` is
`inventoryProse(inv)`, as the theme prompt has it. The nodes user message
carries:

- `target`: a screen with its sections, or a shell with its regions and the
  pages that use it;
- `ia`: the screens (ids, names, types, kinds, routes), the navigation and
  the new components;
- `steps`: the full step objects this screen serves, or the steps of the
  pages a shell frames, so fields and alternatives are visible;
- `vocabulary`: the scope's nouns;
- DS13's additions: the brief's feel, personality and imagery, the theme's
  `defaults` and the kind's `main` block.

### 2. `src/stages/design/stage-screens.ts`

`runDesign(ctx)` in order:

1. `runBrief`, `runTheme` (steps 17, 18); skip each when its artifact exists
   and isn't stale.
2. `inv = await inventory()`; `schemas = makeScreensSchema(inv)`;
   `shells = layoutShells(theme.layouts)`;
   `dctx = { scope, flows, inventory: inv, shells }`.
3. IA: `runSpecStage({ stage: 'design-ia', schema: schemas.Ia, validate:
   (ia) => validateIa(ia, dctx), review: screensReviewGuides() })`.
4. Nodes: `pLimit(3)` over the screens and the shells a framed page uses:
   `runSpecStage({ stage: 'design-nodes-S03', schema: schemas.ScreenNodes,
   validate: (out) => validateScreenNodes('S03', withDefaults(out.nodes,
   theme), ia, dctx), review: screensReviewGuides() })`.
5. Assemble: `screens = resolveScreens(ia, allNodes, theme)`; run
   `validateScreens(screens, dctx)` and
   `validateLayout(screens, skeleton(screens, inv), inv)`. Route each
   mandatory issue with `routeIssues` (`route.ts`, DS12): a region to the
   theme call, a screen, section or step to the IA call, a node or a page to
   its screen's or shell's nodes call. A rerun starts from the call's last
   output with the issues as `seed` and no reviewers. An IA fix reruns the
   nodes of the screens it changed; a theme fix the shells'. One pass.
6. `writeArtifact(run, 'screens', screens, { stage: 'design', inputs:
   ['scope', 'flows', 'brief', 'theme'] })`; write `02-skeleton.json` and
   `02-wireframes.html`.
7. Gap report: `02-ds-gaps.json` = `newComponents.map(({ name, purpose,
   closestExisting, usedOn }) => …)` plus idea name and run id; append one
   JSON line per component to `.weave-cache/ds-gaps.jsonl`.
8. Render (step 22).

The runner never fails a stage for issues (D1.12); only a model error, such
as a cut answer, ends the run. Rounds and costs are logged per call; `show`
sums them under `design`.

### 3. Tests

`stage.test.ts` with a fake llm scripted from the reading-list fixtures
(brief, theme, IA, nodes per screen and shell): the assembled artifact equals
the fixture; a scripted whole-artifact failure on S02 reruns exactly
`design-nodes-S02`; a scripted section issue reruns the IA once; the gap file
lists the fixture's new component.

## Done when

```sh
pnpm weave run fixtures/ideas/freelancer-workspace.md --to design
```

produces `02-brief.json`, `02-theme.json`, `02-screens.json`,
`02-skeleton.json`, `02-wireframes.html`, `02-design.md` and
`02-ds-gaps.json` with zero mandatory issues; `show` lists `design` with its
rounds.

## Watch out

- Keep `p-limit` at 3; the API's rate limit is unknown and 429s cost time.
- The IA call's input includes the whole flows JSON; watch its token count
  in `events.jsonl`. The ecommerce catalog was cut at 65k output tokens on
  2026-10-30, so give the IA and nodes calls a budget and watch for cuts.
