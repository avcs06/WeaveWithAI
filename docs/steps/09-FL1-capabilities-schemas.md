# 09 · FL1 Capabilities and schemas

Phase 2 · 40 min · Depends: F2 · Decisions: D2.1 to D2.7 · Spec:
specs/flows.md "Capabilities", "Schema"

## Goal

The capability list the scope prompt and validators share, and the zod
schemas for scope and flows, exactly as the spec writes them, proven to fit
the API's limits.

## What this step does

1. **The capability list as data**: what the MVP supports (accounts, CRUD,
   search, ...) and what it doesn't (payments, uploads, email, ...). The scope
   prompt shows both lists; an unsupported need becomes an out-of-scope entry
   with a placeholder behaviour.
2. **The scope and flows schemas from the spec**: roles, vocabulary nouns,
   capabilities, assumptions and questions; flows made of paired steps (what
   the user does, what the website shows) with every form field, the data
   effects of each step, and the alternative paths.
3. **A test proves both schemas convert** to JSON Schema within the API's
   limits (depth, no `oneOf`).

After this step the flows stage has its data shapes and its vocabulary.

## Implementation details

### 1. `src/config/capabilities.ts`

```ts
export type Capability = { id: string; supported: boolean; description: string };
export const CAPABILITIES: readonly Capability[] = [
  { id: 'accounts', supported: true, description: 'email and password sign up, sign in, sign out' },
  { id: 'userOwnedData', supported: true, description: 'each user sees their own records' },
  { id: 'crud', supported: true, description: 'list, view, create, edit, delete' },
  { id: 'search', supported: true, description: 'free-text search over lists' },
  { id: 'filterSort', supported: true, description: 'filters and sorting on lists' },
  { id: 'pagination', supported: true, description: 'pages of results' },
  { id: 'roles', supported: true, description: 'up to 2 roles' },
  { id: 'publicPages', supported: true, description: 'landing page, public read-only views' },
  { id: 'statusWorkflow', supported: true, description: 'statuses with allowed transitions' },
  { id: 'reorder', supported: true, description: 'manual ordering of items' },
  { id: 'tagsCategories', supported: true, description: 'tags and categories' },
  { id: 'datesDeadlines', supported: true, description: 'dates and deadlines' },
  { id: 'simpleCounts', supported: true, description: 'totals and counts' },
  { id: 'profileSettings', supported: true, description: 'profile and settings' },
  { id: 'payments', supported: false, description: 'payments' },
  { id: 'fileUploads', supported: false, description: 'images, attachments' },
  { id: 'emailSending', supported: false, description: 'notifications, password reset by email' },
  { id: 'realtime', supported: false, description: 'live collaboration, chat' },
  { id: 'externalIntegrations', supported: false, description: 'third-party APIs, OAuth logins' },
  { id: 'maps', supported: false, description: 'geolocation' },
  { id: 'multiTenant', supported: false, description: 'organizations, invitations' },
  { id: 'i18n', supported: false, description: 'translations' },
] as const;
export const CAPABILITY_IDS = CAPABILITIES.map((c) => c.id) as [string, ...string[]];
export const supportedList = () => CAPABILITIES.filter((c) => c.supported).map((c) => `${c.id} (${c.description})`).join(', ');
export const unsupportedList = () => CAPABILITIES.filter((c) => !c.supported).map((c) => `${c.id} (${c.description})`).join(', ');
```

`z.enum` needs a tuple type; the cast above gives it one without
hand-copying the ids.

### 2. `src/stages/flows/schema.ts`

Copy the spec's schema block verbatim (constants, `Assumption`, `Question`,
`Scope`, `Field`, `Effect`, `Step`, `Alternative`, `Flow`, `Flows`, types).
Also export `type Step`, `type Flow`, `type Field`, `type Question`,
`type Assumption` with `z.infer`; later stages import them.

### 3. `src/stages/flows/schema.test.ts`

- `toJsonSchema(Scope, 'Scope')` and `toJsonSchema(Flows, 'Flows')` succeed.
- `stats.depth <= 8` for both; no `oneOf` anywhere; print `stats` once so the
  numbers land in the test output.
- `Flows` has at least the properties `flows`, `assumptions`, `questions`.

## Done when

```sh
pnpm test -- src/stages/flows/schema.test.ts
pnpm typecheck
```

## Watch out

- Keep every field required (the spec's rule for constrained decoding);
  "none" is `""`, `[]` or `null`, never a missing key.
- Don't rename fields: the prompts, validators, renderer, matrix and tests
  all use these names.
