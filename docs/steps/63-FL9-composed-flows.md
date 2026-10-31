# 63 · FL9 Flows in three stages: catalog, expand, reconcile

Phase 2 · 7 h · Depends: FL5, FL8 · Decisions: D2.1 E, D2.3, D1.12 B, D1.13 A ·
Spec: OPTIONS.md D2.1 E

## Goal

The flows of any idea written by three stages instead of one call that cannot
finish: a catalog of flows and of the reusable fields, forms and subflows;
an expansion of the flows in batches, each batch its own stage; and a
reconciliation that validates and reviews the whole document and patches it.

## What this step does

1. **Stage `flows-catalog`.** One generation through the runner, as scope is
   today. The catalog is the whole flows document minus the steps: every
   flow with every field it has today except `steps`, which a one-paragraph
   `description` of what the flow does replaces (`alternatives` go with the
   steps, since they branch from step ids); the reusable parts: `fields`
   (defined once), `forms` (named groups of fields the same form reuses
   across flows) and `subflows` (named step sequences such as confirming a
   delete or signing in when needed); assumptions and questions. Its own
   validators (catalog rules), its own reviewer guide (coverage, reach,
   first success, reuse found), the D1.12 schedule, and the artifact
   `01-flows/02-catalog.json`.
2. **Stage `flows-expand`, in batches that are stages.** The catalog's flows
   are split into batches of `n` ids (start at 8; lower it when a batch is
   cut); each batch runs through the runner as its own stage,
   `flows-expand-1`, `flows-expand-2`, …, in parallel: it expands its ids
   into full flows, reusing fields, forms and subflows by name, and may add
   a reusable part when none fits. Each batch is validated (flow rules that
   hold within a flow) and reviewed on its own, with its own rounds, report
   and state entry. The batches are assembled into `01-flows/03-expand.json`.
3. **Stage `flows`, reconciliation.** Starts from the draft without a first
   generation: round 1 validates the whole document with every flow rule,
   including the cross-flow ones (created nouns read and managed, auth
   flows, role coverage, unknown field names, duplicate or clashing ids).
   From round 2 the fix is a patch call: flows to replace or add, parts to
   add or replace, flows to remove, new assumptions and questions, applied
   in code. No reviewers here: the batches were reviewed, and this stage
   only makes the document consistent, so it runs validation rounds alone
   and ends as soon as the validators are clean. The result is
   `01-flows/04-reconcile.json`, the artifact every later stage reads, with subflows
   still referenced by name and a helper that inlines them for consumers.
4. **Two runner additions**, nothing else in the loop changes: `start`, a
   document to validate in round 1 instead of generating one, and `compose`,
   a strategy with `draft` and `fix` so a stage can generate and patch its
   own way. The default stays the single conversation; scope is untouched.

After this step the flows stage finishes on the freelancer workspace and on
anything bigger, with the work split into calls that each fit their budget.

## Before you start

- `prompt-flows.md` (FL8) stays the system prompt for every flows call; the
  product standard applies to all three stages. Each stage adds a short
  user-message template saying which job this call does. Code fills
  placeholders only.
- The example flow in the prompt comes from the reading-list fixture, which
  this step converts first.
- The pipeline stays a static list: `scope`, `flows-catalog`,
  `flows-expand`, `flows`, then the rest. The batch stages are children of
  `flows-expand` in `state.json`, events and reports; `weave show` lists
  them under it; `--from flows-expand` reruns every batch.

## Implementation details

### 1. `src/agents/01flows/schema.ts`

```ts
export const Field = z.object({
  id,                           // FD01, FD02, ...; no technical name, the contract stage chooses names later
  label, meaning, type, required,
  min: z.number().nullable(),   // length for text types, value for numbers; null when none
  max: z.number().nullable(),
  options, example,
});
export const Form = z.object({ id: z.string(), name: z.string(), fields: z.array(z.string()) });       // FM01, field ids
export const Subflow = z.object({ id: z.string(), name: z.string(), steps: z.array(Step), alternatives: z.array(Alternative) }); // SF01
export const Step = z.object({
  id, kind, userAction, websiteResponse,
  fields: z.array(z.string()),  // field ids, or a form's fields through `form`
  form: z.string(),             // a form id, or ""
  subflow: z.string(),          // a subflow id, or ""; then userAction and websiteResponse are ""
  effects,
});
export const Flows = z.object({ flows: z.array(Flow), fields, forms, subflows, assumptions, questions });
// The catalog's flow: everything a flow has except steps, which `description` replaces; alternatives come with the steps.
export const FlowHeader = Flow.omit({ steps: true, alternatives: true }).extend({ description: z.string() });
export const Catalog = Flows.extend({ flows: z.array(FlowHeader) });   // the document minus steps
export const FlowBatch = z.object({ flows: z.array(Flow), newFields, newForms, newSubflows });
export const FlowsPatch = z.object({ upsertFlows, upsertFields, upsertForms, upsertSubflows, removeFlows: z.array(z.string()), assumptions, questions });
export function inlineSubflows(flows: Flows): Flows;   // for consumers that want plain steps (renderer, design)
```

Artifacts: `flows-catalog` → `01-flows/02-catalog.json`, `flows-draft` →
`01-flows/03-expand.json`, `flows` → `01-flows/04-reconcile.json` (the existing name).

### 2. Prompts (`src/agents/01flows/`)

User-message templates beside `prompt-flows.md`:

- `prompt-flows-catalog.md` (`idea`, `scope`): the catalog only, with the
  reusable parts: "a field used by two flows is defined once; a form is a
  group of fields the same screen asks for; a subflow is a step sequence two
  flows share".
- `prompt-flows-expand.md` (`idea`, `scope`, `catalog`, `flowIds`): expand
  the named flows into steps and alternatives, headers unchanged; reuse
  parts by name; add a part only when none fits.
- `prompt-flows-patch.md` (`idea`, `scope`, `flows`, `issues`, `answers`):
  patches only; keep ids and everything an issue does not name.
- Review guides: `review-flows-catalog.md` (coverage, reach, first success,
  reuse) and `review-flows-expand.md` (steps, side effects, experience
  within the batch). Reconciliation passes no guide, so no reviewer runs;
  the current `review-flows.md` is split into those two.

### 3. `src/runner/runSpecStage.ts`

```ts
export type Draft<T> = { data: T; raw: string; model: string; calls: GenerateResult<unknown>[] };
export type Compose<T> = {
  draft(round: number): Promise<Draft<T>>;
  fix(round: number, current: T, pending: Issue[], answers: Answers): Promise<Draft<T>>;
};
// SpecStageOptions gains:
//   compose?: Compose<T>;            default: today's single conversation
//   start?: { data: T; raw: string } round 1 validates this instead of generating (reconciliation)
```

Every call in `draft.calls` is logged as an `llm:call`; `raw` is what the
reviewers read. The schedule, reviewers, questions and known issues are
untouched. With `start`, round 1 has `generated: false`.

### 4. Stages (`src/agents/01flows/`)

- `catalog.ts`: `runCatalog` (default compose; `validateCatalog`; the
  catalog guide), writes `01-flows/02-catalog.json` and `01-flows/02-catalog.md`.
- `expand.ts`: `runExpand` splits the catalog into batches of
  `EXPAND_BATCH_SIZE` (8), runs `runSpecStage` per batch in parallel with
  stage name `flows-expand-<n>`, compose = one expand call that returns a
  `FlowBatch` (its fix = the same call with the issues appended), validator
  = `validateBatch(batch, catalog)` (within-flow rules), the expand guide;
  then `assemble` → `01-flows/03-expand.json`. The parent stage's state entry
  records the batch count and the sum of rounds and known issues.
- `reconcile.ts`: `runReconcile` with `start` = the draft, validator =
  `validateFlows` (all rules), compose = `{ draft: never called, fix: patch
  call + applyPatch }`, no review guide; writes `01-flows/04-reconcile.json` and
  `01-flows/04-reconcile.md`.
- `stage.ts` registers the three `StageDef`s; `src/agents/stages.ts` and
  `PIPELINE` list `flows-catalog`, `flows-expand`, `flows`.

### 5. Validators (`rules/`)

- Catalog rules (`CAT-001` …): header ids F01, F02, … unique; roles exist;
  every in-scope item named by at least one description; fields unique
  camelCase; forms reference existing fields; subflows have steps and valid
  alternatives; assumptions and questions continue the scope's numbering.
- Within-flow rules on a batch: FLOW-001 to 005, 011 to 013, 016 to 021,
  with FLOW-007 now "field, form or subflow name exists in the catalog".
- Cross-flow rules at reconciliation: everything, plus 008 to 010, 014, 015,
  022, 023 and the unused-part warning.
- `validate.ts` exposes `catalogRules`, `batchRules`, `flowRules`; one
  mutation per rule as today.

### 6. Renderer, fixture, CLI

- `render.ts`: `renderCatalog`; `renderFlows` inlines subflows and looks
  fields up by name; `min`/`max` shown by type.
- `reading-list.flows.json` converted to the new shape (its sign-in steps
  become a subflow, the book form a form); a `reading-list.catalog.json`
  fixture derived from it.
- `weave show` lists the batch stages indented under `flows-expand`;
  `weave golden` copies the three flows artifacts.

### 7. Tests

`schema.test.ts` (new schemas convert, depth), `validate.test.ts` (three rule
lists, one mutation each, hand-broken set unchanged), `render.test.ts`
snapshots, `runSpecStage.test.ts` (`start` skips generation, `compose` calls
are logged), `expand.test.ts` (batching, assembly, dedupe, a fake llm per
schema), `reconcile.test.ts` (applyPatch, a start document fixed by one
patch), `stage.test.ts` (the three stages end to end on fixtures).

## Done when

```sh
pnpm test
pnpm typecheck
pnpm weave run fixtures/ideas/freelancer-workspace.md --to flows-reconcile   # three stages complete; 01-flows/04-reconcile.md readable
pnpm weave show <runId>                                            # catalog, the batches, reconciliation with rounds and cost
```

## Watch out

- Keep every schema field required; `""`, `[]` and `null` mean none.
- A batch that is cut at its budget is the signal to lower
  `EXPAND_BATCH_SIZE`; record the size that worked in the findings.
- The patch call reads the whole document and must never return it whole.
- Never widen a validator to make the reconciled document pass; a wrong rule
  gets a task.
- Costs: the catalog reviewers read the whole catalog and each batch's
  reviewers read that batch; input tokens are cheap, output is what to
  watch. Reconciliation spends only on patch calls.
