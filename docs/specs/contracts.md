# Spec: contracts

Decisions: D4.1 to D4.6. Prompt: `src/agents/03contract/prompts/prompt.md`.

## What this stage decides

The contract has one job: every widget knows where its data comes from, and
every step that loads or changes data knows which operation it calls (C7).
Backend feasibility, such as access, errors, limits, lifecycles,
transactions and seed data, is out of scope for the MVP.

- **The model decides:** the entities and the vocabulary noun each
  implements; their fields; the enums; the operations, with the flow fields
  each takes and the steps each serves; and the operations that load each
  widget's data.
- **Code decides:** every record has `id`, `createdAt` and `updatedAt`. Sign
  up, sign in and sign out are built in, with their own User record.

It runs once the design catalog has its widgets, side by side with the
screen, invent, draw and frame calls. It reads the scope's vocabulary, the
flows and the catalog's widgets.

## Schema (`src/agents/03contract/schema.ts`)

| Part         | Holds                                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| `enums`      | `name`, and `values` with a snake_case `key` and the flow option as `label`                               |
| `entities`   | `name`, `noun`, `fields`: `name`, `kind`, `enum`, `ref`, `list`, `required`                                |
| `operations` | `id`, `kind` (list, get, create, update, delete, action), `entity`, `summary`, `inputs`, `flowSteps`      |
| `inputs`     | `field`, a flow field id; `as`, the entity field it sets or a list filters by, or `q` for a list search   |
| `widgets`    | `widget`, a catalog widget id; `reads`, the list and get operations that load what it shows               |

## Validator rules

`src/agents/03contract/validation/validation.ts`: `validateContract(contract, ctx)`
with `ctx = { scope, flows, widgets }`.

| Rule         | Severity  | Check                                                                                                       |
| ------------ | --------- | ----------------------------------------------------------------------------------------------------------- |
| CONTRACT-001 | mandatory | Entities PascalCase singular and unique; fields camelCase and unique per entity; enums PascalCase; enum keys snake_case; operation ids camelCase and unique |
| CONTRACT-002 | mandatory | `enum` and `ref` fields and operation entities resolve                                                       |
| CONTRACT-003 | mandatory | Every entity's `noun` is in the vocabulary; every noun with effects in the flows has an entity               |
| CONTRACT-004 | mandatory | No field named `id`, `createdAt` or `updatedAt`; no entity named `User`                                      |
| CONTRACT-007 | mandatory | Each input is a flow field, set as a field of the operation's entity, or `q` on a list; a get or a delete takes none |
| CONTRACT-010 | mandatory | Every operation serves a step; every step with effects is served by an operation                             |
| CONTRACT-011 | mandatory | A step's effect is served by an operation of the matching kind on the noun's entity                          |
| CONTRACT-012 | mandatory | Every field a widget asks for at a step is an input of an operation serving the same flow; sign-up and sign-in fields go to the built-in operations |
| CONTRACT-020 | mandatory | Every value a widget shows is a field of its noun's entity, and one of the widget's reads loads that entity; a widget that repeats over a noun reads its list; entries name catalog widgets and list or get operations |

## Done when

- The reading-list contract passes every rule, and each rule fails on its
  mutation.
- Every golden idea produces a contract with zero mandatory issues.
