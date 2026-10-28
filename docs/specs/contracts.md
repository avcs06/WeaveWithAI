# Spec: contracts

Decisions: D4.1 to D4.6 (and D6.4 for auth later). Prompt:
`src/stages/contracts/prompt.md`.

## What this stage decides

The model decides meaning; code decides wire format (D4.1 D).

- **Model decides:** entities and the vocabulary noun each implements; fields
  with kind, required, nullable, unique, limits, defaults; where each value
  comes from (client, server, derived); sensitive fields; relations and what
  happens on delete; lifecycle states and transitions; operations with kind,
  access, inputs, filters, sorting, search, errors, transactions; which flow
  steps each operation serves; which steps need no server; seed rows and
  invalid examples; business rules the flows don't define (`needsRule`).
- **Code decides (`src/stages/contracts/conventions.ts`):** paths, methods,
  status codes, error envelope, IDs, timestamps, owner field, pagination,
  date and money formats, the `User` entity and auth operations.
- **Code derives (`compile.ts`):** database columns (client and server fields),
  request schemas (client fields), response views (everything not sensitive,
  plus derived fields). So public API shapes stay separate from storage (R2)
  without the model writing them twice.

It works from flows and scope only, in parallel with design. Screen data needs
are matched to it later, in reconciliation.

## Conventions

| Item       | Convention                                                                                                            |
| ---------- | --------------------------------------------------------------------------------------------------------------------- |
| Paths      | list, create: `GET`, `POST /api/<kebab-plural>`; get, update, delete: `GET`, `PATCH`, `DELETE /api/<kebab-plural>/:id`; action: `POST /api/<kebab-plural>/:id/<kebab-verb>` |
| Auth paths | `POST /api/auth/sign-up`, `POST /api/auth/sign-in`, `POST /api/auth/sign-out`, `GET /api/auth/me`                      |
| Status     | create 201 with the record; get, update, action 200; delete 204; list 200                                             |
| Errors     | `{ error: { code, message, fields: [{ field, message }] } }`. `validation_failed` 400 (D4.3), `unauthenticated` 401, `forbidden` 403, `not_found` 404, `conflict` 409, `rule_violation` 409 |
| Records    | `id` UUID (D4.5), `createdAt`, `updatedAt`; `ownerId` on user-owned entities. All set by the server                    |
| Values     | camelCase keys; `date` as `YYYY-MM-DD`; `datetime` ISO 8601 UTC; `money` integer minor units                          |
| Lists      | query `page` (from 1), `pageSize` (default 20, max 100), `sort` (`field` or `-field`), `q`, filters by field name; response `{ items, page, pageSize, total }` (D4.4 A) |
| Update     | `PATCH`; every body field optional                                                                                    |
| Users      | Built in: `User` with `email` (unique), `name`, `passwordHash` (sensitive), `role`; the contract can add `auth.userFields` |

## Schema (`src/stages/contracts/schema.ts`)

```ts
export const FIELD_KINDS = [
  'string', 'text', 'email', 'url', 'phone', 'int', 'decimal', 'money', 'percent',
  'boolean', 'date', 'time', 'datetime', 'enum', 'ref',
] as const;
export const ERROR_CODES = ['validation_failed', 'unauthenticated', 'forbidden', 'not_found', 'conflict', 'rule_violation'] as const;

const Value = z.object({ field: z.string(), value: z.string().describe('Literal written as text: "42", "true", "2026-11-10"') });

export const EntityField = z.object({
  name: z.string().describe('camelCase; never id, createdAt, updatedAt or ownerId'),
  kind: z.enum(FIELD_KINDS),
  enum: z.string().describe('Enum name when kind is enum; ""'),
  ref: z.string().describe('Entity name when kind is ref; ""'),
  list: z.boolean().describe('Many values, e.g. tags'),
  required: z.boolean(),
  nullable: z.boolean(),
  unique: z.boolean(),
  default: z.string().describe('Default as text; ""'),
  minLength: z.number().int().nullable(),
  maxLength: z.number().int().nullable(),
  min: z.number().nullable(),
  max: z.number().nullable(),
  source: z.enum(['client', 'server', 'derived']).describe('client: sent in requests; server: set by the server; derived: computed for responses'),
  sensitive: z.boolean().describe('Never returned to clients'),
  searchable: z.boolean(),
  sortable: z.boolean(),
  filterable: z.boolean(),
  flowField: z.string().describe('The flow field name this stores; ""'),
  description: z.string(),
});

export const Entity = z.object({
  name: z.string().describe('PascalCase singular'),
  noun: z.string().describe('The scope vocabulary noun it implements'),
  description: z.string(),
  ownership: z.enum(['user', 'shared', 'public', 'system']),
  fields: z.array(EntityField),
  relations: z.array(z.object({
    name: z.string(),
    kind: z.enum(['belongsTo', 'hasMany']),
    target: z.string(),
    onDelete: z.enum(['cascade', 'restrict', 'setNull']),
  })),
  lifecycle: z.object({
    field: z.string().describe('Status field name; "" if none'),
    transitions: z.array(z.object({ from: z.string(), to: z.string(), by: z.string().describe('Operation id') })),
  }),
});

export const Enum = z.object({
  name: z.string().describe('PascalCase'),
  values: z.array(z.object({ key: z.string().describe('snake_case'), label: z.string().describe('As users see it; matches flow options') })),
});

const Param = z.object({
  name: z.string(),
  kind: z.enum(FIELD_KINDS),
  enum: z.string(),
  ref: z.string(),
  list: z.boolean(),
  required: z.boolean(),
  description: z.string(),
});

export const Operation = z.object({
  id: z.string().describe('camelCase verb + noun, e.g. createProject, completeTask'),
  kind: z.enum(['list', 'get', 'create', 'update', 'delete', 'action']),
  entity: z.string(),
  summary: z.string(),
  access: z.enum(['public', 'authenticated', 'owner', 'role']),
  roles: z.array(z.string()).describe('Role ids when access is role; []'),
  body: z.array(z.string()).describe('Entity field names accepted in the request body; []'),
  extraBody: z.array(Param).describe('Inputs that are not entity fields; []'),
  filters: z.array(z.string()).describe('List only'),
  search: z.boolean().describe('List only: free-text search over searchable fields'),
  sort: z.array(z.string()).describe('List only; the first is the default, "-" prefix for descending'),
  output: z.enum(['entity', 'list', 'none', 'custom']),
  outputFields: z.array(Param).describe('Custom output only; []'),
  errors: z.array(z.object({ code: z.enum(ERROR_CODES), when: z.string() })),
  transaction: z.boolean(),
  transition: z.object({ from: z.string(), to: z.string() }).describe('Actions that move a lifecycle state; empty strings otherwise'),
  needsRule: z.string().describe('A business rule this needs that no flow defines; ""'),
  flowSteps: z.array(z.string()),
});

export const Contract = z.object({
  auth: z.object({
    enabled: z.boolean(),
    roles: z.array(z.string()),
    userFields: z.array(EntityField).describe('Extra fields on the built-in User; []'),
  }),
  enums: z.array(Enum),
  entities: z.array(Entity),
  operations: z.array(Operation),
  localSteps: z.array(z.object({ step: z.string(), reason: z.string() }))
    .describe('Steps that need no server: opening a form, cancelling, switching a view'),
  seed: z.array(z.object({ entity: z.string(), rows: z.array(z.array(Value)) })),
  invalidExamples: z.array(z.object({
    operation: z.string(),
    body: z.array(Value),
    violates: z.string().describe('The rule it breaks, e.g. title is required'),
  })),
  assumptions: z.array(Assumption),
  questions: z.array(Question),
});
```

Auth operations are not in `operations`; the conventions add them when
`auth.enabled` is true, and they serve the `signUp`, `signIn` and `signOut` flows.

## Flow type to contract kind

| Flow field type | Entity field kind | Notes                                      |
| --------------- | ----------------- | ------------------------------------------ |
| text            | string            |                                            |
| longText        | text              |                                            |
| email, url, phone | email, url, phone |                                          |
| password        | auth only         | never an entity field                      |
| integer         | int               |                                            |
| decimal, money, percent | decimal, money, percent |                          |
| date, time, datetime | date, time, datetime |                                  |
| boolean         | boolean           |                                            |
| singleChoice    | enum              | enum labels equal the flow options         |
| multiChoice     | enum, `list: true` | same                                      |

## Validator rules

`src/stages/contracts/validate.ts`: `validateContract(contract, ctx)` with
`ctx = { scope, flows }`. Seed and invalid-example rules use `compile.ts`.

| Rule         | Severity  | Check                                                                                                                       |
| ------------ | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| CONTRACT-001 | mandatory | Entities PascalCase singular and unique; fields camelCase and unique per entity; enums PascalCase; enum keys snake_case; operation ids camelCase and unique |
| CONTRACT-002 | mandatory | `enum`, `ref`, relation targets and operation entities resolve                                                              |
| CONTRACT-003 | mandatory | Every entity's `noun` is in the scope vocabulary; every noun with effects in the flows has an entity                         |
| CONTRACT-004 | mandatory | No field named `id`, `createdAt`, `updatedAt`, `ownerId`; no entity named `User` (extend it through `auth.userFields`)      |
| CONTRACT-005 | mandatory | Operations on `user`-owned entities have `owner` or `role` access; `public` only for reads in flows of roles that don't sign in |
| CONTRACT-006 | mandatory | Kind semantics: list outputs a list; create outputs the entity; delete outputs none; filters, sort and search only on lists; body empty on list, get, delete |
| CONTRACT-007 | mandatory | Body fields exist on the entity with `source: client`; filters are `filterable`; sort fields `sortable`; search needs a `searchable` field |
| CONTRACT-008 | mandatory | Sensitive fields never in bodies, filters, sort or outputs                                                                  |
| CONTRACT-009 | mandatory | Errors: single-record operations list `not_found`; non-public ones `unauthenticated`; `owner` and `role` ones `forbidden`; operations with a body `validation_failed`; a unique field in a body `conflict`; actions with a transition `rule_violation` |
| CONTRACT-010 | mandatory | Every operation serves at least one flow step; every step or alternative with effects is served by an operation; `localSteps` never lists a step with effects |
| CONTRACT-011 | mandatory | Effects match kinds: create to create, list to list, read to get, update to update or action, delete to delete, on the entity for that noun |
| CONTRACT-012 | mandatory | Every field a step submits maps to a body field of its operation (`flowField` or same name); kinds compatible per the table; required in the flow means required on create; choice options equal enum labels |
| CONTRACT-013 | warning   | Entity limits are equal to or stricter than the flow's limits                                                               |
| CONTRACT-014 | mandatory | Lifecycle transitions use keys of the status field's enum; an action's `transition` matches one, and its `by` names that action |
| CONTRACT-015 | mandatory | 3 to 10 seed rows per entity, each valid against the compiled create schema; `ref` values point at seeded rows              |
| CONTRACT-016 | mandatory | At least one invalid example per create operation, and each fails that operation's compiled input schema                    |
| CONTRACT-017 | warning   | Fields named email, slug or handle are unique; operations touching two or more entities set `transaction`                   |
| CONTRACT-018 | mandatory | An operation with `needsRule` also has a matching question (routed to flows in reconciliation)                              |
| CONTRACT-019 | mandatory | If any scope role signs in, `auth.enabled` is true and `auth.roles` match the scope's signed-in roles                       |

## Compile (`src/stages/contracts/compile.ts`)

Pure functions from the contract to zod schemas: per entity `createInput`,
`updateInput` (partial), `view` (output), and per list operation `query` and
`page`. Used now for CONTRACT-015 and 016; reused in Phase 6 to generate the
app's `packages/contract` (zod schemas, types, a typed client) and the
Drizzle schema.

## Rendering

- `03-contract.md`: entities with fields as tables, enums, then operations
  with method and path from the conventions, access, body, errors and the flow
  steps they serve; local steps; open business rules.
- Optional: `03-openapi.json` from the compiled schemas, for the demo.

## Done when

- Every golden flow set produces a contract with zero mandatory issues
  within 3 rounds, run in parallel with design.
- Every seed row validates; every invalid example fails.
- A hand-broken contract (a create without `validation_failed`, a sensitive
  field in a body, a flow field missing from the body) fails exactly
  CONTRACT-009, CONTRACT-008 and CONTRACT-012.
- Accepted outputs are saved to `fixtures/golden/<idea>/`.
