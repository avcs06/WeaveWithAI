# 11 · FL3 Flow prompts

Phase 2 · 30 min · Depends: FL1 · Decisions: D2.1 B, D2.5 A · Spec:
specs/flows.md "Shape"; drafts in `src/stages/flows/prompt-scope.md`,
`prompt-flows.md`

## Goal

Finished prompts with every placeholder filled by code, and the user
messages that carry the inputs, so step 13 only wires them.

## What this step does

1. **Code fills the two prompt drafts** (scope, flows): the capability lists,
   the answers already given, and a format example flow taken from the
   reading-list fixture.
2. **Builders for the user messages**: the idea text for the scope call; the
   idea plus the scope JSON for the flows call. Idea files lose their HTML
   comments on the way.
3. **Review the drafts** against the schema and the rules so the prompt never
   allows what a validator forbids.
4. **A test** fills both prompts and finds no placeholder left.

After this step the flows stage has its words; step 13 only wires them.

## Implementation details

### 1. `src/stages/flows/prompt.ts`

```ts
export type Answers = Record<string, string>;          // question id → answer
export function answersBlock(answers: Answers): string; // "None yet." or "- Q01: …" lines
export function scopeSystemPrompt(answers: Answers): string;   // fills capabilitiesSupported, capabilitiesUnsupported, answers
export function flowsSystemPrompt(answers: Answers): string;   // fills capabilitiesSupported, answers, exampleFlow
export function scopeUserMessage(idea: string): string;        // "# Idea\n\n<idea text>"
export function flowsUserMessage(idea: string, scope: Scope): string; // "# Idea" block, then "# Scope (01-scope.json)" with a ```json block
```

`exampleFlow` is the "add a book" flow from the reading-list fixture,
`JSON.stringify(flow, null, 2)`, never a reference idea's flow. Idea text
goes through `loadPrompt` so its HTML comments (the depth and role notes in
`fixtures/ideas/*.md`) are stripped.

### 2. Review the drafts

Read both drafts against the spec and the schema and fix what's off. Check
at least: the id formats match the schema descriptions; every schema field
the model must fill is mentioned or implied; the capability placeholders
read as sentences; the flows prompt says `effects` use vocabulary nouns
exactly; nothing in a prompt contradicts a validator rule (a prompt that
allows what a rule forbids wastes rounds). Keep the prompts in `.md`; code
only fills placeholders (AGENTS.md).

### 3. `src/stages/flows/prompt.test.ts`

- `scopeSystemPrompt({})` and `flowsSystemPrompt({ Q01: 'yes' })` contain no
  `{{` and contain "accounts (" and "- Q01: yes" respectively.
- `flowsSystemPrompt` contains `"id": "F03"` or whatever the example flow's id is.
- `flowsUserMessage` contains the scope's app name inside a ```json block.

## Done when

```sh
pnpm test -- src/stages/flows/prompt.test.ts
```

## Watch out

- Placeholders use exactly the names in the drafts' first-line comments;
  `fillPrompt` throws on any mismatch, which is the point.
