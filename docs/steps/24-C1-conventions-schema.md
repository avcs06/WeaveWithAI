# 24 · C1 Contract conventions and schema

Phase 4 · 40 min · Depends: FL1 · Decisions: D4.1 D, D4.3 A, D4.4 A, D4.5 A ·
Spec: specs/contracts.md "Conventions", "Schema"

## Goal

The conventions table as code (paths, methods, status codes, errors,
records, lists, the built-in `User`) and the contract schema; both reused by
the validators, the renderer, the mock API and the typed client.

## What this step does

1. **The conventions as code**: how an operation becomes a path and a method,
   which status code each kind returns, the error envelope and its status per
   code, the server-set record fields, list query defaults, the built-in
   `User`, and the mapping from flow field types to contract field kinds.
   Also the same table as markdown for the prompt.
2. **The contract schema**: entities with fields and relations and lifecycle,
   enums, operations with access and inputs and errors, local steps, seed
   rows, invalid examples, questions.
3. **Tests** for paths, plurals and status codes; the schema through the bridge.

After this step the model decides meaning and code decides the wire shape,
with one table both the validators and the generated app read.

## Implementation details

### 1. `src/agents/03contract/conventions.ts`

```ts
export const SERVER_FIELDS = ['id', 'createdAt', 'updatedAt', 'ownerId'] as const;
export const ERROR_STATUS = { validation_failed: 400, unauthenticated: 401, forbidden: 403, not_found: 404, conflict: 409, rule_violation: 409 } as const;
export const LIST_DEFAULTS = { page: 1, pageSize: 20, pageSizeMax: 100 } as const;
export const AUTH_PATHS = { signUp: 'POST /api/auth/sign-up', signIn: 'POST /api/auth/sign-in', signOut: 'POST /api/auth/sign-out', me: 'GET /api/auth/me' } as const;
export const FLOW_TO_KIND: Record<FieldType, FieldKind | 'auth'> = { text: 'string', longText: 'text', email: 'email', url: 'url', phone: 'phone', password: 'auth', integer: 'int', decimal: 'decimal', money: 'money', percent: 'percent', date: 'date', time: 'time', datetime: 'datetime', boolean: 'boolean', singleChoice: 'enum', multiChoice: 'enum' };

export function kebab(name: string): string;            // ProjectTask → project-task
export function plural(kebabName: string): string;      // project → projects, category → categories, status → statuses; a small irregulars map
export function collectionPath(entity: string): string; // /api/<kebab-plural>
export function pathFor(op: Operation): { method: 'GET' | 'POST' | 'PATCH' | 'DELETE'; path: string }; // list GET /api/projects; get GET /api/projects/:id; action POST /api/projects/:id/<kebab verb>
export function actionVerb(opId: string, entity: string): string; // completeTask + Task → complete; archiveProject → archive
export function statusFor(kind: Operation['kind']): number;     // create 201, delete 204, else 200
export const BUILT_IN_USER: Entity;  // email (unique, email), name (string), passwordHash (string, sensitive, server), role (string, server)
export function conventionsForPrompt(): string;   // the spec's conventions table as markdown, for {{conventions}}
export function fieldKindTableForPrompt(): string; // the flow-type to kind table as markdown
export function errorEnvelope(code: ErrorCode, message: string, fields?: { field: string; message: string }[]): { error: {...} };
```

### 2. `src/agents/03contract/schema.ts`

Copy the spec's schema (`FIELD_KINDS`, `ERROR_CODES`, `Value`, `EntityField`,
`Entity`, `Enum`, `Param`, `Operation`, `Contract`) with `Assumption` and
`Question` imported from the flows schema. Export inferred types for each.

### 3. Tests

`conventions.test.ts`: `pathFor` for list, get, create, update, delete and
an action (`completeTask` on `Task` → `POST /api/tasks/:id/complete`);
`statusFor`; `plural` for `project`, `category`, `status`, `person` (irregular
map → `people`). `schema.test.ts`: `Contract` through `toJsonSchema`, depth
and property count printed (expect about 128 properties).

## Done when

```sh
pnpm test -- src/agents/contracts
pnpm typecheck
```

## Watch out

- The mock API (step 38) and the typed client (step 37) import `pathFor`
  and `statusFor`; a change here changes generated code.
