# Spec: reconciliation and freeze

Decisions: D5.1 to D5.5. Prompts: `src/agents/04reconcile/prompts/patch-flows.md`,
`prompt-patch-design.md`, `prompt-patch-contract.md`.

## What this stage does

Makes flows, design and contract agree, then freezes them. One code differ
builds a coverage matrix from IDs and lists mismatches; each mismatch has an
owner; only owners get model calls, and they answer with typed patches by ID.
Your two loops (design with flows, then contract with design) are two passes
of the same differ, run in the order R2 proposed (D5.1 D).

Source of truth when artifacts disagree (D5.3 A): flows own business meaning,
design owns presentation, the contract owns technical shape.

## Coverage matrix (`src/agents/04reconcile/matrix.ts`)

Pure function: `buildMatrix(flows, screens, contract) → Matrix`. One row per
step and per alternative:

```ts
type MatrixRow = {
  id: string; // F03.S02 or F03.A01
  flow: string;
  kind: 'user' | 'system' | 'alternative';
  fields: string[]; // field names submitted at this step
  effects: { noun: string; change: string }[];
  screens: string[]; // screens whose flowSteps include it
  interactiveNodes: string[]; // *-action, navigation, input nodes serving it
  inputs: Record<string, string[]>; // field name → input node IDs
  operations: string[]; // operations whose flowSteps include it
  local: boolean; // listed in contract.localSteps
  dataNeeds: { node: string; ref: string; resolvedTo: string | null }[];
};
```

Data resolution: a node's `Noun.attribute` resolves to the entity whose
`noun` is `Noun`, then to a field whose name or `flowField` equals the
attribute after normalizing case, spaces and underscores, or to the
conventions' `id`, `createdAt`, `updatedAt`. Unresolved needs become RECON-003.

`04-matrix.json` stores the rows; `04-reconcile.md` renders a table per flow
(step, screens, nodes, operations, status) for review and the demo.

## Mismatches

| Rule      | Owner    | Severity  | Mismatch                                                                                                  |
| --------- | -------- | --------- | --------------------------------------------------------------------------------------------------------- |
| RECON-001 | design   | mandatory | A user step has no interactive node                                                                       |
| RECON-002 | design   | mandatory | A submitted field has no input node on a screen serving the step                                          |
| RECON-003 | contract | mandatory | A node shows `Noun.attribute` that no entity field provides (owner is design when the node invents data no flow mentions) |
| RECON-004 | contract | mandatory | A step with effects has no operation and isn't local                                                      |
| RECON-005 | contract | warning   | An operation serves no step that any screen shows                                                         |
| RECON-006 | flows    | mandatory | Design raised a question or marked a step impossible                                                       |
| RECON-007 | flows    | mandatory | An operation has `needsRule`: a business rule the flows must define (R2's "available slots" case)         |
| RECON-008 | contract | mandatory | Field type or options differ between the flow field and the entity field (design, when its input disagrees with the flow) |
| RECON-009 | design   | mandatory | A public screen serves a step whose operation needs sign-in (contract, when the flow's role doesn't sign in) |
| RECON-010 | design   | mandatory | A new component serves no flow step                                                                       |
| RECON-011 | the stale stage | mandatory | An artifact was built from an older version of its inputs                                           |

## Procedure (`src/agents/04reconcile/procedure.ts`)

1. **Stale check.** If design or contract was built from an older flows
   version, rerun that stage first (RECON-011).
2. **Pass 1: flows and design.** Build the matrix; collect RECON-001, 002,
   006, 009 (design side), 010, plus the design's own `questions` and
   `impossibleSteps`. Send design mismatches to the design patch call and flow
   mismatches to the flows patch call. In `--interactive` mode, blocking
   questions go to you first and the answers ride along. Apply patches, rerun
   each artifact's own validator; new mandatory issues from a patch join the
   next round. At most 2 rounds.
3. **Contract refresh.** If pass 1 changed flows, send the contract patch call
   the changed flow IDs and their new steps and fields.
4. **Pass 2: design and contract.** Collect RECON-003, 004, 005, 007, 008,
   009 (contract side). RECON-007 goes to flows as a question first; its
   answer then goes to the contract patch call. At most 2 rounds.
5. **Freeze.** Zero mandatory issues from every stage validator and the
   matrix: write `spec.lock.json`. Otherwise stop and print the remaining
   issues with their owners (D5.5 A).

```json
{
  "lockedAt": "2026-10-30T18:20:00+05:30",
  "flows": { "version": 3, "hash": "…" },
  "screens": { "version": 2, "hash": "…" },
  "theme": { "version": 1, "hash": "…" },
  "contract": { "version": 2, "hash": "…" },
  "warnings": 7
}
```

Implementation stages read only the versions in the lock.

## Patches (D5.4 B, `src/agents/04reconcile/patch.ts`)

Typed upserts and removals by ID, so untouched items stay byte-identical.
Whole flows are the unit for flows, because steps renumber.

```ts
export const FlowsPatch = z.object({
  upsertFlows: z.array(Flow),
  removeFlows: z.array(z.string()),
  assumptions: z.array(Assumption),
  answers: z.array(z.object({ question: z.string(), answer: z.string() })),
  resolutions: z.array(z.object({ issue: z.string(), action: z.string() })),
});

export const DesignPatch = z.object({
  upsertScreens: z.array(Screen), removeScreens: z.array(z.string()),
  upsertSections: z.array(Section), removeSections: z.array(z.string()),
  upsertNodes: z.array(Node), removeNodes: z.array(z.string()),
  upsertNewComponents: z.array(NewComponent), removeNewComponents: z.array(z.string()),
  resolutions: z.array(z.object({ issue: z.string(), action: z.string() })),
});

export const ContractPatch = z.object({
  upsertEnums: z.array(Enum), removeEnums: z.array(z.string()),
  upsertEntities: z.array(Entity), removeEntities: z.array(z.string()),
  upsertOperations: z.array(Operation), removeOperations: z.array(z.string()),
  upsertLocalSteps: z.array(z.object({ step: z.string(), reason: z.string() })),
  removeLocalSteps: z.array(z.string()),
  upsertSeed: z.array(z.object({ entity: z.string(), rows: z.array(z.array(Value)) })),
  assumptions: z.array(Assumption),
  questions: z.array(Question),
  resolutions: z.array(z.object({ issue: z.string(), action: z.string() })),
});
```

`applyFlowsPatch`, `applyDesignPatch`, `applyContractPatch`: pure functions,
each with tests for upsert, remove, and "unrelated items unchanged". Removing a
screen removes its sections and nodes; removing an entity is refused while an
operation still names it (the validator reports it).

## Done when

- Every golden spec set freezes with zero mandatory issues.
- Seeded defects are found and fixed within the round limits:
  - delete a body field from a contract operation: RECON-002 or CONTRACT-012
    found, contract patched;
  - add a node showing `Project.budget` with no such field: RECON-003 found,
    contract or design patched;
  - add an operation with `needsRule: "what makes a slot available"`:
    RECON-007 sends a question to flows; the answer reaches the contract.
- Unchanged items keep their bytes across patches (hash test).
