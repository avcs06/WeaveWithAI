# 17 · DS3 Brief

Phase 3 · 60 min · Depends: DS1, DS2, FL6 · Decisions: D3.3 B · Spec:
specs/design.md "Brief", BRIEF rules; draft `src/stages/design/prompt-brief.md`

## Goal

The brief call: the model picks direction (personality, density, seed hue,
fonts, radius, focus ring, entity colors), validated, saved as `02-brief.json`.

## What this step does

1. **The brief schema**: the model's design direction (personality, voice,
   density, a seed hue and chroma level, fonts from the allowlist, radius,
   focus ring, extra color sets for categories, imagery).
2. **Two rules** check it (hues in range, set names valid).
3. **The brief prompt** is filled with the font lists and the design-system
   summary; the idea and the scope are the input.
4. **The design stage starts** with this one call and writes `02-brief.json`.

After this step the look of an app is decided by the model as a direction,
not as hex values.

## Implementation details

### 1. `src/stages/design/schema.ts` (first part)

The `Brief` schema from the spec, importing `UI_FONTS` and `DISPLAY_FONTS`
from `src/config/fonts.ts`. `makeScreensSchema` joins this file in step 19.

### 2. `src/stages/design/validate.ts` (first part)

`validateBrief(brief: Brief): Issue[]` with BRIEF-001 (hues 0 to 360,
personality 3 to 5 words, at most 4 entity sets) and BRIEF-002 (entity set
names camelCase, unique, not `base`, `success`, `warning`, `error`, `info`,
`primary`, `surface`). Fixture: `__fixtures__/reading-list.brief.json` and
one mutation per rule in `__fixtures__/mutations.ts` (the file grows with
the next steps).

### 3. `src/stages/design/prompt.ts` (first part)

```ts
export function briefSystemPrompt(inv: Inventory): string;    // fills uiFonts, displayFonts, dsSummary
export function briefUserMessage(idea: string, scope: Scope): string;
```

Review `prompt-brief.md` against the schema: every field named, the hue
advice kept (avoid red and amber), fonts from the lists only.

### 4. Stage

`src/stages/design/stage.ts` starts here with `runBrief(ctx)`: idea and
scope in, `runSpecStage` with `Brief`, `writeArtifact(run, 'brief', …,
{ inputs: ['scope'] })`. Register a `design` stage whose `run` calls
`runBrief` only for now; steps 18 and 21 extend it.

### 5. Tests

`validate.test.ts` for the two rules; `prompt.test.ts` fills without leftovers.

## Done when

```sh
pnpm weave run fixtures/ideas/project-tracker.md --to design   # a brief with zero mandatory issues
pnpm test -- src/stages/design
```

## Watch out

- `seedHue` is a number in degrees; the schema's description must say so or
  the model answers with a color name.
