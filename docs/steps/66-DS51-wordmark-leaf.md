# 66 · DS51 The wordmark is a leaf

Phase 3 · 10 min · Depends: DS45 · Spec: specs/design.md rule table (DESIGN-028)

## Goal

Only the node that shows the app's name is the wordmark, not a box whose
`what` mentions it.

## Why

In the freelancer run 20261101-0150 the frame wrote boxes whose `what`
mentions the wordmark: "top wordmark and navigation column" (SH1.n01, a
216 × 168 container), "a row holding the wordmark" (SH2.n01), "a column with
wordmark and tagline" (SH2.n10). Both checks match `/wordmark/i` on `what`:

- The wireframes drew the logo text in the middle of SH1.n01, over the
  sidebar's navigation, on every app page.
- DESIGN-028's wordmark check (DS45) fails such a box when its text is not
  the app's name.

## What this step does

1. `isWordmark(node)` in `rules/helpers.ts`: a shell node whose `what`
   mentions the wordmark and whose role is not `container`.
2. `08assemble/wireframes.ts` (`shape`) and `rules/design-028-copy.ts` (its
   `wordmark` check) use it.

## Tests

- Wireframes: with a logo, a container whose `what` is "a row holding the
  wordmark" draws as a container, and the leaf inside it draws as the logo.
- DESIGN-028: a container whose `what` mentions the wordmark, with text
  other than the app's name, raises nothing.

## Done when

```sh
pnpm typecheck
pnpm test
```
