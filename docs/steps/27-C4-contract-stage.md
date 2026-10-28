# 27 · C4 Contract prompt and stage

Phase 4 · 40 min · Depends: C3, DS7 · Decisions: D4.1 D · Spec:
specs/contracts.md "What this stage decides"; draft `src/stages/contracts/prompt.md`

## Goal

The contract call wired as a stage that runs in parallel with design from
the same flows version.

## What this step does

1. **The contract prompt is filled** with the conventions table and the
   field-kind table; the scope and the flows are the input.
2. **The contract stage** calls the model through the runner with the
   contract validator and writes `03-contract.json` and its markdown.
3. **The CLI learns groups**: design and contract run at the same time from
   the same flows version; each is skipped or redone on its own; one failing
   doesn't abort the other.

After this step a run produces the design and the contract in parallel.

## Implementation details

### 1. `src/stages/contracts/prompt.ts`

```ts
export function contractSystemPrompt(): string;                  // fills conventions, fieldKindTable
export function contractUserMessage(scope: Scope, flows: Flows): string;  // "# Scope" and "# Flows" json blocks
```

Review the draft: say how seed `ref` values are written (step 26 decided
the form), that `auth.userFields` is the only way to extend `User`, and
that `flowSteps` must list alternative ids too when an alternative has
effects.

### 2. `src/stages/contracts/stage.ts`

`contractStage = { name: 'contract', produces: ['contract'], run }`:
scope and flows in, `runSpecStage` with `Contract` and
`validateContract(c, { scope, flows })`, artifact `contract` with
`inputs: ['scope', 'flows']`, then render (step 28).

### 3. Parallel groups in the CLI

`PIPELINE` becomes `(string | string[])[]`:
`['scope', 'flows', ['design', 'contract'], 'reconcile', 'freeze', …]`. A
group runs its pending members with `Promise.all`; a member already done
and not stale is skipped; a failure in one member still lets the other
finish, then the run stops with both results printed. `--to design` or
`--to contract` runs only that member.

### 4. Tests

`stage.test.ts` with a fake llm; `cli.test.ts` gains a case where a group
of two fake stages runs concurrently (record start order) and `--to` picks
one member.

## Done when

```sh
pnpm weave run fixtures/ideas/project-tracker.md --to contract   # zero mandatory issues
pnpm weave show <id>                                              # design and contract both done, same flows version in their envelopes
```
