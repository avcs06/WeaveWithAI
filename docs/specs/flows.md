# Spec: scope and user flows

Decisions: D2.1 to D2.7. Prompts: `src/agents/01flows/01scope/prompts/prompt.md`,
`src/agents/01flows/prompts/flows.md`.

## What this stage decides

- Who uses the app (roles), what each needs to get done, and the things the
  app keeps track of (vocabulary), in the words the app's users would use.
- Every user action and every visible website response, per flow, with every
  form field a user fills in.
- Alternative paths: invalid input, failure, empty lists, cancel, confirm,
  denied, not found.
- What each step changes (creates, lists, reads, updates, deletes which noun).
- What's out of scope, with a placeholder behavior; assumptions; questions.

It never decides layout, components, colors, endpoints, tables or technology.
"The website shows the project" is a flow. "A modal on the right" is design.
"POST /projects" is a contract.

## Shape (D2.1 B)

```text
idea.md ─▶ scope call ─▶ 01-flows/01-scope.json ─▶ [--interactive: ask blocking questions]
                                      └─▶ flows call ─▶ 01-flows/04-reconcile.json ─▶ 01-flows/04-reconcile.md
```

Both calls go through `runSpecStage` with their own validator. Answers in
`input/answers.json` (keyed by question ID) are passed to both calls on reruns.

## Capabilities (`src/agents/01flows/config/capabilities.ts`)

| Supported (MVP)                                                   | Unsupported: out of scope with a placeholder              |
| ----------------------------------------------------------------- | --------------------------------------------------------- |
| `accounts`: email and password sign up, sign in, sign out          | `payments`                                                |
| `userOwnedData`: each user sees their own records                  | `fileUploads` (images, attachments)                       |
| `crud`: list, view, create, edit, delete                           | `emailSending` (notifications, password reset by email)   |
| `search`, `filterSort`, `pagination`                               | `realtime` (live collaboration, chat)                     |
| `roles`: up to 2                                                   | `externalIntegrations` (third-party APIs, OAuth logins)   |
| `publicPages`: landing page, public read-only views                | `maps` (geolocation)                                      |
| `statusWorkflow`: statuses with allowed transitions                | `multiTenant` (organizations, invitations)                |
| `reorder`: manual ordering of items                                | `i18n`                                                    |
| `tagsCategories`, `datesDeadlines`, `simpleCounts` (totals, counts) |                                                           |
| `profileSettings`                                                  |                                                           |

## Schema (`src/agents/01flows/schema.ts`)

Every field is required; "none" is an empty string, empty array or `null`.
That keeps constrained decoding predictable. Nesting stays within 8 levels
(Meta allows 10), which is why limits sit directly on `Field`.

```ts
import { z } from 'zod';
import { CAPABILITY_IDS } from '../../config/capabilities';

export const FIELD_TYPES = [
  'text', 'longText', 'email', 'password', 'url', 'phone',
  'integer', 'decimal', 'money', 'percent',
  'date', 'time', 'datetime', 'boolean', 'singleChoice', 'multiChoice',
] as const;
export const CHANGES = ['create', 'list', 'read', 'update', 'delete'] as const;
export const ALTERNATIVE_KINDS = [
  'invalid', 'failure', 'empty', 'cancel', 'confirm', 'denied', 'notFound', 'conflict', 'other',
] as const;

export const Assumption = z.object({
  id: z.string().describe('A01, A02, ...'),
  text: z.string(),
  kind: z.enum(['scope', 'permission', 'behavior', 'data', 'presentation']),
  affects: z.array(z.string()).describe('Flow or step IDs it affects; [] while scoping'),
});

export const Question = z.object({
  id: z.string().describe('Q01, Q02, ...'),
  question: z.string(),
  whyItMatters: z.string(),
  defaultAnswer: z.string().describe('What will be assumed if nobody answers'),
  blocking: z.boolean().describe('True only if the answer changes scope, permissions, business rules or data'),
});

export const Scope = z.object({
  app: z.object({
    name: z.string(),
    summary: z.string().describe('Who it is for, the problem, the core loop: 2 to 4 sentences'),
    audience: z.string(),
  }),
  roles: z.array(z.object({
    id: z.string().describe('camelCase, e.g. member'),
    name: z.string(),
    description: z.string(),
    signedIn: z.boolean(),
  })),
  vocabulary: z.array(z.object({
    noun: z.string().describe('PascalCase singular, e.g. Project'),
    description: z.string(),
    belongsTo: z.string().describe('Role id that owns these records, or "shared"'),
  })),
  capabilities: z.array(z.object({
    id: z.enum(CAPABILITY_IDS),
    needed: z.boolean(),
    note: z.string(),
  })),
  inScope: z.array(z.string()),
  outOfScope: z.array(z.object({ item: z.string(), reason: z.string(), placeholder: z.string() })),
  assumptions: z.array(Assumption),
  questions: z.array(Question),
});

export const Field = z.object({
  name: z.string().describe('camelCase; the same name means the same thing in every flow'),
  label: z.string(),
  meaning: z.string().describe('What the value means to the business'),
  type: z.enum(FIELD_TYPES),
  required: z.boolean(),
  minLength: z.number().int().nullable(),
  maxLength: z.number().int().nullable(),
  min: z.number().nullable(),
  max: z.number().nullable(),
  options: z.array(z.string()).describe('Choice types only; [] otherwise'),
  example: z.string(),
});

export const Effect = z.object({
  noun: z.string().describe('A noun from the scope vocabulary'),
  change: z.enum(CHANGES),
});

export const Step = z.object({
  id: z.string().describe('F01.S01'),
  kind: z.enum(['user', 'system']),
  userAction: z.string().describe('"" for system steps'),
  websiteResponse: z.string().describe('What the user can see, or what changes'),
  fields: z.array(Field).describe('Every field the user fills in at this step; [] if none'),
  effects: z.array(Effect).describe('[] when nothing is stored or loaded'),
});

export const Alternative = z.object({
  id: z.string().describe('F01.A01'),
  from: z.string().describe('The step ID it branches from'),
  kind: z.enum(ALTERNATIVE_KINDS),
  condition: z.string(),
  websiteResponse: z.string(),
  resumesAt: z.string().describe('Step ID the user returns to, or "" if the flow ends'),
});

export const Flow = z.object({
  id: z.string().describe('F01'),
  name: z.string(),
  role: z.string().describe('A role id from the scope'),
  category: z.enum(['auth', 'onboarding', 'core', 'manage', 'browse', 'settings', 'admin']),
  authKind: z.enum(['none', 'signUp', 'signIn', 'signOut']),
  goal: z.string(),
  preconditions: z.array(z.string()),
  steps: z.array(Step),
  alternatives: z.array(Alternative),
  outcome: z.string().describe('What changed and what is still there after a refresh'),
});

export const Flows = z.object({
  flows: z.array(Flow),
  assumptions: z.array(Assumption).describe('New assumptions made while writing flows'),
  questions: z.array(Question).describe('New questions; each has a default answer'),
});

export type Scope = z.infer<typeof Scope>;
export type Flows = z.infer<typeof Flows>;
```

## Validator rules

`src/agents/01flows/04reconcile/validation/validation.ts` exports `validateScope(scope)` and
`validateFlows(flows, scope)`. Each rule is a small function; the file lists
them in order. Every rule needs a passing and a failing fixture in
`src/agents/01flows/__fixtures__/`.

### Scope

| Rule      | Severity  | Check                                                                                                   |
| --------- | --------- | ------------------------------------------------------------------------------------------------------- |
| SCOPE-001 | mandatory | 1 to 3 roles; ids unique and camelCase                                                                  |
| SCOPE-002 | mandatory | 1 to 6 vocabulary nouns; PascalCase singular; unique; `belongsTo` is a role id or `shared`              |
| SCOPE-003 | mandatory | Every question has a non-empty `defaultAnswer`; at most 5 blocking questions                            |
| SCOPE-004 | mandatory | Every unsupported capability with `needed: true` has an `outOfScope` entry with a placeholder           |
| SCOPE-005 | mandatory | Assumption and question IDs unique and well formed (`A01`, `Q01`)                                       |
| SCOPE-006 | warning   | Summary is 2 to 4 sentences; `inScope` has at least 3 items                                             |

### Flows

| Rule     | Severity  | Check                                                                                                                         |
| -------- | --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| FLOW-001 | mandatory | IDs unique and well formed: `F01`, `F01.S01`, `F01.A01`; step and alternative IDs carry their flow's prefix                    |
| FLOW-002 | mandatory | Steps numbered from S01 without gaps                                                                                          |
| FLOW-003 | mandatory | `role` is a scope role id                                                                                                     |
| FLOW-004 | mandatory | User steps have `userAction` and `websiteResponse`; system steps have `websiteResponse` and an empty `userAction`             |
| FLOW-005 | mandatory | Choice fields have at least 2 options; other types have none                                                                  |
| FLOW-006 | mandatory | Field names camelCase and unique within a step                                                                                |
| FLOW-007 | mandatory | A field name has the same type and the same options in every flow (different labels: warning)                                 |
| FLOW-008 | mandatory | Effects name vocabulary nouns                                                                                                 |
| FLOW-009 | mandatory | Every noun created somewhere is also listed or read somewhere                                                                 |
| FLOW-010 | warning   | Every created noun can be updated and deleted, or an assumption or out-of-scope entry says why not                            |
| FLOW-011 | mandatory | Every user step with fields and a create or update effect has `invalid` and `failure` alternatives from it                    |
| FLOW-012 | mandatory | Every `list` effect has an `empty` alternative from that step                                                                 |
| FLOW-013 | mandatory | Every `delete` effect has a `confirm` or `cancel` alternative from that step                                                  |
| FLOW-014 | mandatory | If any role signs in: flows with `authKind` `signUp`, `signIn` and `signOut` exist                                            |
| FLOW-015 | mandatory | Every role has at least one flow outside the `auth` category                                                                  |
| FLOW-016 | mandatory | Alternatives start from a step of the same flow; `resumesAt` is empty or a step of the same flow                              |
| FLOW-017 | mandatory | No technology words in steps or alternatives: endpoint, API, HTTP, REST, GraphQL, SQL, database, JSON, and upper-case GET, POST, PUT, PATCH, DELETE |
| FLOW-018 | warning   | No layout words: left, right, top, bottom, sidebar, navbar, modal, dialog, popup, dropdown, drawer, tab, tooltip, toast, hamburger, pixel |
| FLOW-019 | mandatory | `outcome` is non-empty on every flow                                                                                          |
| FLOW-020 | warning   | 4 to 15 flows; at most 12 steps per flow                                                                                      |
| FLOW-021 | warning   | Every field has `meaning` and `example`                                                                                       |
| FLOW-022 | warning   | Steps that mention payment, upload, attach, send email, notify, live, chat or map are covered by an out-of-scope entry or assumption |
| FLOW-023 | mandatory | New assumption and question IDs continue the scope's numbering without clashes                                                |

Word checks match whole words, case-insensitively except the HTTP verbs.

## Rendering (`src/agents/01flows/render.ts`)

`01-flows/04-reconcile.md`, for people and for the demo:

```text
# Shelf: user flows

## F03 Add a book to the reading list
Reader · core · Goal: remember a book to read later
Before: signed in.

1. The reader chooses to add a book. The website shows an empty book form.
2. The reader fills in:
   - Title (required, up to 200 characters), e.g. "The Left Hand of Darkness"
   - Author (optional, up to 120 characters), e.g. "Ursula K. Le Guin"
   - Shelf (required, one of: To read, Reading, Finished), e.g. "To read"
   The website saves the book and shows it first in the reading list.
   Changes: creates Book.

Other paths
- F03.A01 (from 2, invalid) The title is empty: the website marks the field and keeps what was typed. Back to 2.
- F03.A02 (from 2, failure) Saving fails: the website keeps the values and offers to retry. Back to 2.
- F03.A03 (from 1, cancel) The reader cancels: nothing is saved. Flow ends.

Outcome: the book is saved and is still there after a refresh.
```

## Done when

- The freelancer workspace and the dashboard editor produce scope and flows
  with zero mandatory issues within 3 rounds each. The ecommerce store is the
  unseen test: run once without tuning on it, result recorded either way, then
  tuned on until it passes too.
- You read each `01-flows/04-reconcile.md` and would accept it as a spec.
- The prompt's format example comes from the reading-list fixture, never from
  a reference idea.
- A hand-broken flows file (a form without an invalid path, a duplicate field
  with another type, the word "endpoint") fails exactly FLOW-011, FLOW-007 and FLOW-017.
- Accepted outputs are saved to `fixtures/golden/<idea>/` for later stages.
