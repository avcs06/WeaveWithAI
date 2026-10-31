# 10 · FL2 Flow validators with tests

Phase 2 · 90 min · Depends: FL1 · Decisions: D2.3, D2.4, D2.6, D2.7 · Spec:
specs/flows.md "Validator rules"

## Goal

Every SCOPE and FLOW rule as a pure function with a passing and a failing
fixture, so prompt tuning later can never weaken what the stage accepts.

## What this step does

1. **A function per rule**: 6 scope rules and 23 flow rules, checking ids,
   roles, consistent field names and types, required alternative paths
   (invalid and failure for every form, empty for every list, confirm for
   every delete), sign-in flows when a role signs in, banned technology
   words, and coverage. Each issue says what is wrong and what would fix it.
2. **A hand-written fixture**: a reading-list app with a scope and six flows
   that passes every rule. It is deliberately not one of the reference
   ideas, because its flow becomes the prompt's format example.
3. **One mutation per rule** breaks exactly that rule in a copy of the
   fixture.
4. **Tests run every rule both ways**, plus the spec's hand-broken set that
   must fail exactly three rules.

After this step prompt tuning can never weaken what the stage accepts,
because the rules are code with tests.

## Implementation details

### 1. `src/agents/01flows/04reconcile/validation/validation.ts`

```ts
export function validateScope(scope: Scope): Issue[];
export function validateFlows(flows: Flows, scope: Scope): Issue[];
```

Structure: `const scopeRules: Record<string, (s: Scope) => Issue[]>` and
`const flowRules: Record<string, (f: Flows, s: Scope) => Issue[]>`, keyed by
rule id, run in order; the exports concatenate. Shared helpers in
`src/core/rules.ts` (used by every stage): `issue(rule, severity, message,
at?)`, `isCamel`, `isPascal`, `uniqueBy`, `wholeWords(text, words, {
caseSensitive })`, `levenshtein`.

Notes per rule, where the table leaves room:

- SCOPE-003: at most 5 questions with `blocking: true`.
- SCOPE-005 and FLOW-023: ids match `/^A\d{2,}$/` and `/^Q\d{2,}$/`; flows'
  new ids must be greater than every scope id of the same kind and unique
  across both sets.
- FLOW-001: `F\d{2,}`, `F\d{2,}\.S\d{2,}`, `F\d{2,}\.A\d{2,}`, prefix equals
  the flow id.
- FLOW-007: build `Map<fieldName, { type, options, flowStep }>` from the first
  occurrence; a later occurrence with another type or options (order-sensitive
  compare) is mandatory; another label only is a warning (FLOW-007 warning
  variant, same id, severity warning).
- FLOW-009: nouns with a `create` effect anywhere must have a `list` or
  `read` effect somewhere.
- FLOW-011: a user step with `fields.length > 0` and an effect `create` or
  `update` needs alternatives from it with kinds `invalid` and `failure`.
- FLOW-017: words `endpoint, API, HTTP, REST, GraphQL, SQL, database, JSON`
  case-insensitive, whole word; `GET, POST, PUT, PATCH, DELETE` only upper
  case. Scan `userAction`, `websiteResponse`, `condition`, `goal`, `outcome`.
- FLOW-018: the layout list, warning.
- FLOW-022: scan for `payment, upload, attach, email, notify, live, chat, map`
  and require an `outOfScope` entry or assumption whose text mentions the
  same word; warning.

Every message says what is wrong and what would fix it, naming the id:
`"F03.S02 saves fields but has no 'invalid' alternative; add F03.A0n with kind invalid from F03.S02"`.

### 2. Fixtures: `src/agents/01flows/__fixtures__/`

- `reading-list.scope.json`: app "Shelf"; roles `reader` (signs in);
  vocabulary `Book`, `Shelf`; capabilities accounts, userOwnedData, crud,
  search; two assumptions, one non-blocking question.
- `reading-list.flows.json`: six flows: sign up (auth), sign in (auth), add a
  book (core, fields title, author, shelf; effects create Book; alternatives
  invalid, failure, cancel), browse and search the shelf (browse, list Book,
  empty alternative), delete a book (manage, confirm alternative), sign out
  (auth). Valid against every rule. The "add a book" flow is also the
  prompt's format example (step 11).
- `mutations.ts`: `export const scopeMutations: Record<RuleId, (s: Scope) => Scope>`
  and `flowMutations: Record<RuleId, (f: Flows) => Flows>`; each clones with
  `structuredClone` and breaks exactly one thing (duplicate role id for
  SCOPE-001; `endpoint` in a websiteResponse for FLOW-017; remove the
  invalid alternative for FLOW-011; ...). One entry per rule in the spec.

### 3. `src/agents/01flows/validation.test.ts`

1. The valid fixtures produce zero mandatory issues (warnings allowed; print them).
2. For every rule in `scopeMutations` and `flowMutations`: the mutated
   fixture's issues include that rule id; the valid fixture's issues don't.
3. The spec's hand-broken set (remove an invalid path, retype a duplicated
   field, add "endpoint") yields exactly the mandatory rule set
   `{FLOW-011, FLOW-007, FLOW-017}`.

## Done when

```sh
pnpm test -- src/agents/flows   # every rule has a passing and a failing case
```

## Watch out

- Rules are pure: no I/O, no model, no `Date`.
- Never relax a rule to make a fixture pass; fix the fixture.
