# 73 · CD4 Contract code

Phase 6 · 2 h · Depends: CD2, C7 · Decisions: D6M.1 B, D6M.3 C, D6M.4 A,
D7.2 C · Spec: specs/contracts.md

## Goal

The `code-contract` stage writes the app's entity layer from the contract,
by code: one folder per entity with its types, a store that survives a
reload, one function per operation, and seed rows. A session entity covers
sign up and sign in. The coding sessions use this layer and never change
it.

## What this step does

1. **Types from the contract.** Each entity's fields, enums and refs
   become a zod schema and its type, plus `id`, `createdAt` and
   `updatedAt`.
2. **A store per entity** made with `createPersistentStore`, so data
   survives a reload and an e2e test sees what it wrote.
3. **One function per operation**, named by its id. The C7 contracts have
   only list, get, create, update and delete, so code writes each body.
   Reads are also hooks for components.
4. **Seed rows from one structured call** through `llm.ts`: four to six
   realistic rows per entity, refs given as row numbers that code turns
   into ids.
5. **A session.** Sign up and sign in take any email, sign out clears it,
   and the current user is a hook. Signed-in screens need one.
6. **Latency and failures on demand.** Each operation waits
   `NEXT_PUBLIC_MOCK_LATENCY_MS`, and fails when a fail switch names it, so
   loading states show and T1 can force the failure alternatives.
7. **`.weave/02-contract/`** gets `entities.md` (each entity's import path,
   fields and operations) and the stage's guidelines.

## Before you start

- The contract (`03-contract.json`): `enums`, `entities` (fields with
  `kind`, `enum`, `ref`, `list`, `required`), `operations` (`id`, `kind`,
  `entity`, `summary`, `inputs`, `flowSteps`) and `widgets` (`reads`).
- An operation's summary may say more than its kind ("List clients sorted
  by follow-up"). The list returns every row; the page sorts and filters
  as its widget's design says.
- `createPersistentStore` and `createStore` come from
  `@packages/utils/state`.
- FE8's agent wrote `types.ts`, `seeds.ts`, `store.ts` and `index.ts` for
  one entity. That shape passed MCP validate, typecheck and lint.

## Implementation details

```text
web/app/entities/<entity>/
  schema.ts   zod schema and type
  seed.ts     the seed rows
  store.ts    createPersistentStore, keyed weave:<entity>
  operations.ts  listClients, getClient, createClient, updateClient, deleteClient;
                 useListClients, useGetClient
  index.ts
web/app/entities/session/   signUp, signIn, signOut, useSession
web/app/entities/mock.ts    latency and the fail switch (localStorage 'weave:fail' = an operation id)
```

```ts
// src/agents/04code/02contract/
export function entityFiles(contract: Contract, seed: SeedRows): Map<string, string>;   // pure: path to file text
export function seedSchema(contract: Contract): z.ZodType<SeedRows>;   // one list per entity, refs as row numbers
export const contractStage: StageDef;   // 'code-contract': the seed call, write the files, ledger origin 'code', typecheck and lint
```

- The seed call's prompt is `prompts/prompt.md` and `prompts/input.md`:
  the scope, the flows' example values and the entities. It runs through
  `runSpecStage` with the schema's own validation; no reviewers.
- A list field is an array; a ref is the other entity's id; a deleted
  record's refs are left as they are (C7 dropped delete rules).
- `prompts/guidelines.md` becomes `.weave/02-contract/guidelines.md`: import
  each entity through its `index.ts`, read through the hooks, write through the
  functions, never edit `entities/`.
- CD5 protects `web/app/entities/**` in every session.

## Tests

1. `entityFiles` on the golden freelancer contract, snapshotted.
2. The generated files for the golden freelancer contract typecheck and
   lint in a scaffolded temp app.
3. `seedSchema` refuses a row whose ref points past the other list.
4. The fail switch makes the named operation throw; latency waits.

## Done when

```sh
pnpm typecheck && pnpm test
```

and `--from code-contract --to code-contract` on
`20261101-0150-freelancer-workspace` writes the layer and the app
typechecks (ask first: the seed call spends about $0.05).

## Watch out

- Name the functions exactly as the operation ids: CD5's design check
  looks for them in each page's code.
- Hooks follow React's naming (`useListClients`); CD5 accepts either name.
