# 26 · C3 Contract validators

Phase 4 · 90 min · Depends: C2 · Decisions: D4.2, D4.6 A · Spec:
specs/contracts.md "Validator rules"

## Goal

CONTRACT-001 to 019 as pure functions over `{ contract, scope, flows }`,
each with a passing and a failing fixture.

## What this step does

1. **19 contract rules as code**: naming, references that resolve, every noun
   has an entity, no reserved fields, access matching ownership, operation
   kinds behaving as their kind, body fields that exist and aren't sensitive,
   the error codes each operation must list, every step with effects served
   by an operation (and the other way round), submitted fields present in
   bodies with compatible types, lifecycle transitions valid, seeds that
   validate and invalid examples that fail, business rules declared as
   questions, auth matching the roles.
2. **A hand-written contract fixture** for the reading-list app plus one
   mutation per rule.
3. **Tests** both ways, plus the spec's hand-broken set.

After this step a contract that passes can be compiled into a working mock
API without surprises.

## Implementation details

### 1. `src/agents/03contract/validate.ts`

```ts
export type ContractContext = { scope: Scope; flows: Flows };
export function validateContract(contract: Contract, ctx: ContractContext): Issue[];
```

Notes per rule:

- 003: every entity's `noun` is in `scope.vocabulary`; every noun that has
  any effect in the flows has an entity.
- 005: ops on `user`-owned entities need `owner` or `role`; `public` only on
  `list`/`get` whose serving steps belong to flows of roles with
  `signedIn: false`.
- 006: `list` → output `list`; `create` → `entity`; `delete` → `none`;
  `filters`, `sort`, `search` only on `list`; `body` empty on list, get, delete.
- 007: body names exist on the entity with `source: 'client'`; filters are
  `filterable`; sort names (minus `-`) are `sortable`; `search` needs at
  least one `searchable` field.
- 009: required error codes per the table; compute the expected set per op
  and report each missing one.
- 010: coverage both ways plus `localSteps` never naming a step with effects.
- 011: for each step effect `{ noun, change }`, some op serving that step has
  the matching kind on the entity for that noun (`read` → `get`, `update` →
  `update` or `action`).
- 012: for each field a user step submits, the op serving that step has a
  body field whose `flowField` or `name` matches; kinds compatible through
  `FLOW_TO_KIND`; `required` on create when the flow says required; choice
  options equal the enum labels (order-insensitive).
- 014: transitions use the status enum's keys; an action's `transition`
  matches a transition whose `by` is that action.
- 015 and 016: `coerceValue` each seed value, `createInput(entity).safeParse`;
  `ref` values must equal the `id`-less identity of a seeded row (use the
  row index in `"<Entity>#<n>"` form in seeds, documented in the prompt) or
  a unique field value of a seeded row. Invalid examples must fail the op's
  input schema.
- 019: `auth.enabled` iff some role signs in; `auth.roles` equal the
  signed-in role ids.

### 2. Fixtures

`__fixtures__/reading-list.contract.json`: entities `Book` (user-owned;
title, author nullable, shelf enum, notes text), `Shelf` enum; operations
listBooks (search, filters shelf, sort -createdAt), getBook, createBook,
updateBook, deleteBook, moveBook (action with transition); localSteps for
opening the form and cancelling; 3 seed rows; one invalid example. Valid
against every rule with the reading-list scope and flows. `mutations.ts`
gains one per CONTRACT rule.

### 3. Tests

Same harness; plus the spec's hand-broken set (a create without
`validation_failed`, a sensitive field in a body, a flow field missing from
the body) yields exactly `{CONTRACT-009, CONTRACT-008, CONTRACT-012}`.

## Done when

```sh
pnpm test -- src/agents/contracts
```
