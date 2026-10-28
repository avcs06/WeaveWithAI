# 38 · S3 Mock API: route handlers and JSON store

Phase 6 · 2.5 h · Depends: S2 · Decisions: D6M.1 A, D6M.2 A, D6M.3 A, D6M.4 A ·
Spec: specs/contracts.md "Conventions"; ARCHITECTURE.md "Generated app"

## Goal

A working API inside the generated app, generated from the frozen
contract: every operation as a Next.js route handler with real validation,
access rules, pagination, errors and status codes, reading and writing one
JSON file. A create adds a row to `web/mocks/db.json`.

## What this step does

1. **Shared mock plumbing goes into the template**, where it is tested once:
   a JSON file store that serializes writes and writes atomically, HTTP
   helpers that produce the exact error envelope and parse bodies and queries
   with zod, a cookie session with a (mock) password hash, a reset route, and
   knobs for latency and forced failures.
2. **Generate the seed**: two users (demo with data, another with none) and
   the contract's seed rows with stable ids and resolved references; copy it
   to the live `db.json`.
3. **Generate one route file per path** from the conventions: list (filters,
   search, sort, pages), create (validation, uniqueness, server fields),
   get, update, delete (cascade, restrict or null on relations), actions
   (lifecycle transitions), and the four auth routes. Access rules come from
   the contract: owner, role, authenticated, public.
4. **Prove it with curl**: a create adds a row to `db.json`, every error code
   in the contract can be provoked, a header forces a failure for tests.

After this step the generated app has a real API with the contract's exact
shape, which a backend can replace later behind the same client.

## Before you start

- Next 16 route handlers: `export async function GET(request: Request,
  { params }: { params: Promise<{ id: string }> })`; `params` is a Promise.
  `Request`, `Response` and `crypto.randomUUID` are Node globals.
- `next dev web` runs with the app root as working directory, so
  `process.cwd()` resolves `web/mocks/db.json`.
- The store, http helpers and session code are the same for every app:
  they live in the template (tested there); codegen writes only the routes
  and the seed.

## Implementation details

### 1. Template: `web/app/api/_mock/` (shared, tested, lint-clean)

**`store.ts`**

```ts
export type Row = Record<string, unknown> & { id: string };
export type Db = { users: Row[]; sessions: { id: string; userId: string; createdAt: string }[] } & Record<string, Row[]>;
export const dbPath = () => process.env.MOCK_DB_PATH ?? join(process.cwd(), 'web/mocks/db.json');
export function readDb(): Promise<Db>;
export function transaction<T>(fn: (db: Db) => T | Promise<T>): Promise<T>;   // serialized through one promise chain; writes atomically (tmp file + rename) when fn changed the db (compare JSON before/after)
export function resetDb(): Promise<void>;   // copies seed.json over db.json
```

**`http.ts`**

```ts
export const STATUS = { validation_failed: 400, unauthenticated: 401, forbidden: 403, not_found: 404, conflict: 409, rule_violation: 409, server_error: 500 } as const;
export function json<T>(data: T, status = 200, init?: ResponseInit): Response;
export function fail(code: keyof typeof STATUS, message: string, fields: { field: string; message: string }[] = []): Response;  // the envelope
export async function parseBody<T>(request: Request, schema: z.ZodType<T>): Promise<T | Response>;   // Response = a 400 with fields from zod issues
export function parseQuery<T>(url: URL, schema: z.ZodType<T>): T | Response;
export async function latency(): Promise<void>;        // MOCK_LATENCY_MS, default 0
export function forcedFailure(request: Request): Response | null;   // x-mock-fail: <code> → fail(code, 'Forced by x-mock-fail')
export function paginate<T>(rows: T[], page: number, pageSize: number): { items: T[]; page: number; pageSize: number; total: number };
export function sortRows<T>(rows: T[], sort: string | undefined): T[];   // 'field' or '-field', stable
export function search<T>(rows: T[], q: string | undefined, fields: (keyof T)[]): T[];
```

**`session.ts`**

```ts
export const COOKIE = 'weave_session';
export function hashPassword(password: string, salt?: string): string;   // sha256(salt:password), "salt$hash"; a mock, not for production
export function verifyPassword(password: string, stored: string): boolean;
export async function currentUser(request: Request, db: Db): Promise<Row | null>;   // cookie → session → user
export function sessionCookie(id: string): string;      // `${COOKIE}=${id}; Path=/; HttpOnly; SameSite=Lax`
export function clearedCookie(): string;
```

**`reset/route.ts`**: `POST /api/_mock/reset` calls `resetDb()`; returns
404 when `process.env.NODE_ENV === 'production'`. Tests use it.

**Tests** in the template (`web/app/api/_mock/__tests__/*.test.ts`, docblock
`/** @jest-environment node */`, a temp `MOCK_DB_PATH`): transaction
serializes two concurrent writes; `paginate`, `sortRows`, `search`;
`parseBody` returns a 400 with field errors; `fail` shape.

Template scripts: `"mock:reset": "node -e \"require('node:fs').copyFileSync('web/mocks/seed.json','web/mocks/db.json')\""`.
Commit these template changes separately from the generator.

### 2. `src/codegen/mockApi.ts`

```ts
export function generateMockApi(run: Run, contract: Contract): string[];
export function buildSeed(contract: Contract): Db;   // pure, also used by tests
```

**Seed** (`web/mocks/seed.json`, copied to `db.json`): two users, `demo`
(`demo@example.com`, password `demo1234`, role = the first signed-in role)
and `other` (`other@example.com`, no rows, for isolation and empty states);
rows per entity from `contract.seed` through `coerceValue`, ids from
`uuid v5`-style hashing of `<Entity>#<n>` (deterministic, `node:crypto`),
`ref` values resolved from the `<Entity>#<n>` form, `ownerId` = demo's id
for user-owned entities, `createdAt`/`updatedAt` spaced one minute apart.

**Routes**, one `route.ts` per path from `pathFor`, built from string
templates in `src/codegen/templates/mock/*.ts`:

- Collection (`web/app/api/<es>/route.ts`): `GET` for the list op:
  `latency()`, `forcedFailure`, access (`currentUser` → 401 unless public;
  `role` access checks `user.role`), `parseQuery(url, ListTasksQuery)`,
  rows = `db.tasks` filtered by owner when access is `owner`, by each
  filter field (`===`, or `includes` for list fields), by `search` over the
  entity's searchable fields, `sortRows`, `paginate`; respond with views
  (`TaskSchema.parse` strips sensitive fields). `POST` for create:
  `parseBody(CreateTaskInput)`, unique-field check → `conflict`, row = body
  + server defaults + `id`, `ownerId`, timestamps, push, `json(view, 201)`.
- Item (`web/app/api/<es>/[id]/route.ts`): `GET`, `PATCH` (partial body,
  conflict on unique, `updatedAt`), `DELETE` (relations: for each child
  entity with a `ref` field to this entity, `cascade` deletes children,
  `setNull` nulls the field, `restrict` answers `conflict` when children
  exist; 204). Unknown id → 404; another owner's row → 403.
- Action (`web/app/api/<es>/[id]/<verb>/route.ts`): `POST`, optional
  `extraBody` schema, lifecycle check `row[statusField] === transition.from`
  else `rule_violation` with the allowed transition in the message, set
  `to`, `updatedAt`, 200 view.
- Auth: `sign-up` (body `{ email, name, password, …userFields }`,
  `conflict` on email, user + session, 201 user view, `Set-Cookie`),
  `sign-in` (401 `unauthenticated` "Invalid email or password"), `sign-out`
  (delete session, cleared cookie, 204), `me` (user view or 401).

Imports in routes: the entity's schemas from `@app/entities/<e>`, helpers
from `../_mock/http` (relative, inside `api/`). Each file through
`writeGenerated` with origin `codegen`, step `S3`; prettier at the end.

### 3. Tests

`mockApi.test.ts`: `buildSeed(golden contract)` has the right row counts and
resolved refs (no `#` left); generated files snapshot; every route file
transpiles; one collection route's text includes the entity's searchable
fields.

## Done when

With the generated project tracker running (`pnpm dev` in the app):

```sh
curl -c jar -s -X POST localhost:3001/api/auth/sign-in -H 'content-type: application/json' -d '{"email":"demo@example.com","password":"demo1234"}'
curl -b jar -s -X POST localhost:3001/api/projects -H 'content-type: application/json' -d '{"name":"Benchmark","description":"x"}'   # 201
grep -c Benchmark web/mocks/db.json                                     # 1
curl -b jar -s 'localhost:3001/api/projects?q=bench'                    # the row
curl -b jar -s -X POST localhost:3001/api/projects -d '{}'              # 400 with fields
curl -s localhost:3001/api/projects                                     # 401
curl -b jar -s localhost:3001/api/projects/00000000-0000-0000-0000-000000000000   # 404
curl -b jar -s -H 'x-mock-fail: server_error' localhost:3001/api/projects          # 500
```

and `pnpm --dir template nx test web` passes the `_mock` tests.

## Watch out

- The envelope and status codes come from `conventions.ts`; keep the
  template's `STATUS` table equal to `ERROR_STATUS` (a test in the generator
  compares them).
- The dev server reloads route modules on edit, but the file store is the
  truth, so nothing is lost between reloads.
