# 20 · DS6 Design validators

Phase 3 · 2.5 h · Depends: DS5 · Decisions: D3.1 B, D3.7 A · Spec:
specs/design.md "Validator rules: Screens (static)"

## Goal

DESIGN-001 to 022 as pure functions over the IA, one screen's nodes, or the
whole screens artifact, each with a passing and a failing fixture.

## What this step does

1. **22 design rules as code**, split by what they need: the IA alone,
   one screen's nodes (fast feedback per call), or the whole artifact
   (coverage across screens).
2. **What they check**: ids and structure, props that exist on the component,
   new components declared with reasons and not duplicating the design
   system, no plain HTML where the design system has a control, every flow
   step and field served by an interactive node or input, required states
   present, one primary action per section, heading structure, every page
   reachable, access matching the roles, real copy.
3. **A hand-written screens fixture** for the reading-list app and one
   mutation per rule.
4. **Tests** run every rule both ways, plus the spec's hand-broken set.

After this step a design that passes is one a frontend can be built from
without guessing.

## Implementation details

### 1. `src/agents/02design/rules/index.ts` (the rest)

```ts
export type DesignContext = { scope: Scope; flows: Flows; inventory: Inventory; ia?: Ia };
export function validateIa(ia: Ia, ctx: DesignContext): Issue[];                       // structure, screens, sections, new components, navigation, reachability
export function validateScreenNodes(nodes: Node[], ia: Ia, ctx: DesignContext): Issue[]; // one screen's nodes, fast feedback per call
export function validateScreens(screens: Screens, ctx: DesignContext): Issue[];        // whole artifact: coverage across screens
```

Which rules run where: IA: 001 (screens and sections part), 003 (declared
components used; checked again whole-artifact), 004, 005, 006, 013 (hero
count), 014 (sections per page), 017, 018, 021. Screen nodes: 001 (node
part, parent in same section, no cycles by DFS), 002, 003 (`new` refs
declared), 007, 011 (states per screen), 012, 013 (hero contents), 014
(inputs per section), 015, 016, 019, 020, 022. Whole artifact: 008, 009,
010 (coverage needs every screen), 003 (every declared component used).

Implementation notes:

- 002: find the inventory component; for each prop in `node.props`, the
  prop must exist and, when `allowedValues` is set, contain the value. Skip
  components whose inventory entry has no props.
- 005: exact match ignoring case → mandatory; `levenshtein ≤ 2` or one name
  contains the other → warning.
- 007: tag in `SUPERSEDED_TAGS` or in any component's `invalidAlternatives`
  that is a bare tag name → mandatory, message names the DS component.
- 008 to 010: build from `flows` the sets of user steps, all step and
  alternative ids, and the fields per user step; walk screens' and nodes'
  `flowSteps`.
- 011: a screen serves a `list` effect when any of its `flowSteps` is a step
  with a list effect; it then needs nodes with states `loading`, `empty`,
  `error` (or the screen's own `states`); submission screens need `invalid`,
  `submitting`, `error` and a success path (`success` state or a submit node
  with `navigatesTo`).
- 015: per page (not dialogs): exactly one node with `headingLevel === 1`;
  sorted by section order then node order, levels never skip by more than 1.
- 016: interactive roles (`primary-action`, `secondary-action`,
  `destructive-action`, `navigation`, `input`) need `text` or `label`;
  `IconButton` (and any inventory component whose name ends in `IconButton`)
  needs `label`.
- 017: BFS from entry pages over navigation items, `navigatesTo` and
  dialog→parent edges; unreachable pages fail; dialogs and drawers need a
  parent page and a node on some screen with `navigatesTo` to them.

Every message names the id and the fix. Reuse `src/core/rules.ts`.

### 2. Fixtures

`__fixtures__/reading-list.screens.json`: four screens for the reading-list
flows: S01 sign in (auth page, entry), S02 shelf (list page, entry after
sign-in, navigation), S03 add a book (dialog, parent S02), S04 book detail
(page). Nodes cover every step and field of the flows fixture; one primary
action per section; loading, empty and error nodes on the list. Keep it
small (about 30 nodes). `mutations.ts` gains one mutation per DESIGN rule.

### 3. `validate.test.ts`

Same harness as step 10: valid fixture has zero mandatory issues; every
mutation triggers its rule and only its rule set is checked; the spec's
hand-broken set (two primary actions, a missing required input, a `button`
element, a new component named `Button`) yields exactly
`{DESIGN-012, DESIGN-010, DESIGN-007, DESIGN-005}`.

## Done when

```sh
pnpm test -- src/agents/design   # every rule passing and failing
```

## Watch out

- Validators get the full inventory; prompts get the summary. Don't pass
  the summary here.
- Keep rule functions under about 30 lines each; split helpers out.
