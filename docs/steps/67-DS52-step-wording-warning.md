# 67 · DS52 Step wording is a warning

Phase 3 · 10 min · Depends: DS51 · Spec: specs/design.md rule table (DESIGN-028)

## Goal

DESIGN-028's step-wording part warns instead of blocking. Its frame-link,
H1 and wordmark parts stay mandatory.

## Why

Step wording is the largest source of known issues in the runs of
2026-11-01: 8 of 9 in the dashboard run, 6 of 10 in ecommerce, 10 of 14 in
the freelancer. Most are not wording mistakes:

- Controls shown only in an error or notFound state: "Try again" and "Back
  to clients" both count for F05.S01.
- Controls tagged with a step they do not do: "View orders", "View
  catalogue" and "View all orders" for F16.S01.
- An issue at a step id has no owner at assemble, so it cannot be fixed
  there anyway.

The user asked that a noisy check of low importance become a warning
(2026-11-01).

## What this step does

1. In `rules/design-028-copy.ts` the step-wording issues are raised with
   `issue('DESIGN-028', 'warning', ...)`, as BRIEF-003 does for its band
   warning. The other parts keep `fail`, which is mandatory.
2. The rule's header comment and the spec's DESIGN-028 row say which part
   warns.
3. DS40, which would route a step-level DESIGN-028 to the widgets serving
   the step, is no longer needed: mark it dropped in PLAN.md with this
   step's id.

## Tests

- `rules/index.test.ts`: the step-wording case is a warning at F03.S01; a
  frame link that does not say its item's label stays mandatory.
- The fixture mutation for DESIGN-028 still raises DESIGN-028.

## Done when

```sh
pnpm typecheck
pnpm test
```
