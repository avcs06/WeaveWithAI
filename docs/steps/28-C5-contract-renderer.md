# 28 · C5 Contract renderer

Phase 4 · 30 min · Depends: C4 · Spec: specs/contracts.md "Rendering"

## Goal

`03-contract.md` for review and the demo; optionally `03-openapi.json`.

## What this step does

1. **Render the contract to markdown**: auth, enums, entities as field tables,
   operations with method and path and errors and the flow steps they serve,
   local steps, open business rules.
2. **Optional OpenAPI** from the compiled schemas, for the demo.
3. **Snapshot test.**

After this step the contract reads as an API spec a backend engineer would
accept.

## Implementation details

### `src/stages/contracts/render.ts`

```ts
export function renderContract(contract: Contract): string;
export function renderOpenApi(contract: Contract): object;   // optional
```

`renderContract`: `# <app>: contract`; auth (enabled, roles, extra user
fields); enums as `Name: key (label), …`; per entity a table of fields
(name, kind, required, nullable, unique, source, limits, description) and
its relations and lifecycle; then operations grouped by entity:
`### createProject · POST /api/projects · 201 · access owner`, summary,
body fields, extra body, filters, search, sort, errors (`code when`),
transaction, transition, serves `F03.S02, F03.A01`; local steps; seed row
counts; open business rules (`needsRule`) and questions.

`renderOpenApi`: OpenAPI 3.1 with one path item per operation from
`pathFor`, request bodies and responses from `z.toJSONSchema` of the
compiled schemas, the error envelope as a shared component. Keep it
minimal; it's for the demo.

### Tests

Snapshot of `renderContract` on the fixture; the OpenAPI object has a
`paths` key per operation and parses as JSON.

## Done when

```sh
pnpm test -- src/stages/contracts/render.test.ts
```

and `03-contract.md` of the golden freelancer workspace reads as an API spec.
