# 37 · S2 Contract codegen: types, client, hooks

Phase 6 · 90 min · Depends: S1, C2 · Decisions: D7.2 A, D6M.1 A · Spec:
specs/contracts.md "Compile"; ARCHITECTURE.md "Generated app"

## Goal

`web/app/entities/<entity>/` for every entity in the frozen contract, by
code: zod schemas and types, a typed client on the template's `Server`
helper, TanStack Query hooks, and the auth entity with session hooks.

## What this step does

1. **Two small template changes**: add `zod` as a dependency of apps, and
   teach the template's `Server` helper to read the API error envelope so
   forms can show field errors from a 400.
2. **For every entity in the frozen contract, generate a folder** under
   `web/app/entities/`: the schemas and types (from the step 25 table, so
   they match the validators), a typed client with one function per
   operation on the contract's paths, TanStack Query hooks (lists, details,
   mutations that invalidate the right queries), and an index.
3. **An auth entity** with sign up, sign in, sign out and "me", plus a hook
   that redirects to the sign-in page when there is no session.
4. **Register the `codegen` stage** (step 38 adds the mock API to it) and
   check the app typechecks and lints.
5. **Tests** snapshot the generated files from the golden contract.

After this step pages have typed hooks for every piece of data the contract
promises.

## Before you start

- The template's `web/app/shared/api/Server.ts` throws `APIError(status)`
  without reading the body. The mock API answers with the contract's error
  envelope, which forms need (`fields`), so `Server` learns to read it
  (a template change; this step names `template/`).
- `web/app/shared/providers/Providers.tsx` already mounts a `QueryClient`.
- Path aliases: `@app/shared/*`, `@app/entities/*` (`tsconfig.base.json`).
- The template has no `zod` dependency; the generated app needs it.

## Implementation details

### 1. Template changes

- `template/package.json`: add `"zod": "^4.6.7"` to `dependencies`;
  `pnpm --dir template install`.
- `template/web/app/shared/api/Server.ts`: parse the envelope.
  ```ts
  export type FieldError = { field: string; message: string };
  export class APIError extends Error {
    constructor(public readonly status: number, public readonly code?: string, message?: string, public readonly fields: FieldError[] = []) {
      super(message ?? `Request failed (${status})`);
      this.name = 'APIError';
    }
  }
  // in request(): const body = response.status === 204 ? undefined : await response.json().catch(() => undefined);
  // if (!response.ok) throw new APIError(response.status, body?.error?.code, body?.error?.message, body?.error?.fields ?? []);
  ```
  Keep `NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'` (the scaffold sets
  it empty for same-origin calls).
- Run the template's checks: `pnpm typecheck`, `pnpm nx lint web`.

### 2. `src/codegen/entities.ts`

```ts
export function generateEntities(run: Run, contract: Contract, screens: Screens): string[];  // files written
```

For each entity `E` (collection name `es` from `conventions.plural`):

**`web/app/entities/<e>/schema.ts`** from `sourceFor(E, contract)` (step 25):

```ts
import { z } from 'zod';
export const TaskStatusSchema = z.enum(['to_do', 'in_progress', 'done']);
export const TaskStatusLabels: Record<z.infer<typeof TaskStatusSchema>, string> = { to_do: 'To do', … };
export const TaskSchema = z.object({ id: z.uuid(), title: …, createdAt: z.iso.datetime(), updatedAt: …, ownerId: z.uuid() });
export type Task = z.infer<typeof TaskSchema>;
export const CreateTaskInput = z.object({ … });  export type CreateTaskInput = z.infer<…>;
export const UpdateTaskInput = CreateTaskInput.partial(); …
export const ListTasksQuery = z.object({ page: …, pageSize: …, sort: z.enum([...]).optional(), q: z.string().optional(), status: TaskStatusSchema.optional(), … });
export const TaskPage = z.object({ items: z.array(TaskSchema), page: z.number(), pageSize: z.number(), total: z.number() });
```

**`api.ts`**: one function per operation, paths as literals from `pathFor`:

```ts
import { Server } from '@app/shared/api';
export const listTasks = (query: ListTasksQuery = {}) => Server.get<TaskPage>('/api/tasks', query);
export const getTask = (id: string) => Server.get<Task>(`/api/tasks/${id}`);
export const createTask = (input: CreateTaskInput) => Server.post<Task>('/api/tasks', input);
export const updateTask = (id: string, input: UpdateTaskInput) => Server.patch<Task>(`/api/tasks/${id}`, input);
export const deleteTask = (id: string) => Server.delete(`/api/tasks/${id}`);
export const completeTask = (id: string, body: CompleteTaskBody = {}) => Server.post<Task>(`/api/tasks/${id}/complete`, body);
```

`extraBody` params become a `<Op>Body` schema in `schema.ts`.

**`hooks.ts`** (`'use client'`, TanStack Query v5):

```ts
export const taskKeys = { all: ['tasks'] as const, list: (q: ListTasksQuery) => ['tasks', 'list', q] as const, detail: (id: string) => ['tasks', 'detail', id] as const };
export const useTasks = (query: ListTasksQuery = {}) => useQuery({ queryKey: taskKeys.list(query), queryFn: () => listTasks(query) });
export const useTask = (id: string | undefined) => useQuery({ queryKey: taskKeys.detail(id ?? ''), queryFn: () => getTask(id!), enabled: Boolean(id) });
export const useCreateTask = () => { const qc = useQueryClient(); return useMutation({ mutationFn: createTask, onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }) }); };
// update: invalidates all and sets detail; delete: invalidates all, removes detail; actions: like update
```

**`index.ts`** re-exports everything from the three files.

**`web/app/entities/auth/`**: `api.ts` (`signUp`, `signIn`, `signOut`, `me`
on the conventions' paths; `User` view schema from `BUILT_IN_USER` plus
`auth.userFields`), `hooks.ts` (`useMe` with `retry: false` and a 401
mapped to `null`; `useSignIn`, `useSignUp` invalidating `['auth']`;
`useSignOut` calling `queryClient.clear()`; `useRequireUser({ signInPath })`
returning `{ user, loading }` and `router.replace(signInPath)` on `null`),
`index.ts`. `signInPath` is the route of the IA's sign-in screen (the auth
screen whose flowSteps include a `signIn` flow), passed at generation.

Each file is written through `writeGenerated(run, path, content, { origin:
'codegen', step: 'S2' })`, then `pnpm exec prettier --write` on the set.

### 3. The `codegen` stage

`src/codegen/stage.ts`: `codegenStage = { name: 'codegen', produces: [], run }`
runs `generateEntities`, then step 38's `generateMockApi`, then in the app
`pnpm typecheck` and `pnpm exec eslint web/app/entities web/app/api` (step
38 adds `web/app/api`). Register it after `scaffold`.

### 4. Tests

`entities.test.ts`: generate from the golden freelancer-workspace contract into
a temp run; snapshot the file list and `entities/task/hooks.ts`; every
file transpiles; `api.ts` contains the paths `pathFor` produces.

## Done when

```sh
pnpm test -- src/codegen
pnpm weave run … --run <id> --to codegen      # after step 38 lands; for now run generateEntities through a test or a script
cd runs/<id>/app && pnpm typecheck && pnpm exec eslint web/app/entities
```

## Watch out

- Entities import only `@app/shared/*`, `zod` and TanStack Query: the import
  direction rule.
- Query keys include the query object; TanStack hashes it deterministically.
