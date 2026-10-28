# 12 · FL4 Flow renderer

Phase 2 · 30 min · Depends: FL1 · Spec: specs/flows.md "Rendering"

## Goal

`01-scope.md` and `01-flows.md`: the human reading of the artifacts, in the
spec's format, for review and the demo.

## What this step does

1. **Render the scope** to a short markdown page: app, roles, vocabulary,
   capabilities, scope, assumptions, questions.
2. **Render the flows** in the spec's format: numbered steps, the fields a
   user fills in with their rules, what changes, the other paths, the outcome.
3. **A snapshot test** on the fixture, read by eye once.

After this step every run has a human-readable spec next to the JSON.

## Implementation details

### `src/stages/flows/render.ts`

```ts
export function renderScope(scope: Scope): string;
export function renderFlows(flows: Flows, scope: Scope): string;
```

`renderScope`: `# <app name>: scope`, summary and audience, roles (name,
signs in or not, description), vocabulary (noun, owner, description),
capabilities marked needed, in scope list, out of scope with placeholders,
assumptions, questions with defaults and a `blocking` mark.

`renderFlows` follows the spec sample line by line:

- `# <app name>: user flows`
- per flow: `## F03 <name>`, then `<Role name> · <category> · Goal: <goal>`,
  `Before: <preconditions joined by "; ">.` (omit when none).
- numbered steps; a system step reads `(system) <websiteResponse>`;
  fields as an indented list: `- <Label> (<required|optional>[, up to N
  characters][, N to M][, one of: a, b, c]), e.g. "<example>"`; then the
  websiteResponse line, then `Changes: creates Book, lists Book.` when there
  are effects.
- `Other paths` with `- F03.A01 (from 2, invalid) <condition>: <websiteResponse>. Back to 2.` or `Flow ends.`
- `Outcome: <outcome>`
- after the flows: new assumptions and questions, if any.

Step numbers in "from N" and "Back to N" are the 1-based positions of the
step ids in the flow.

### Tests

`render.test.ts` renders the reading-list fixtures and compares with
`toMatchSnapshot()`; read the snapshot once by eye before accepting it.

## Done when

```sh
pnpm test -- src/stages/flows/render.test.ts
```
