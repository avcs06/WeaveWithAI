# 17 · DS3 Brief

Phase 3 · 60 min · Depends: DS1, DS2, FL6 · Decisions: D3.3 E, D1.12,
D1.13 C · Spec: specs/design.md "Brief", "Theme", BRIEF and THEME rules

## Goal

The design stage starts: the brief call picks the direction, the theme call
turns it into values, and both are saved, `02-brief.json` and
`02-theme.json`.

## Already built

- `Brief` in `schema.ts`, BRIEF-001 and BRIEF-002 with their fixture and
  mutations, `prompt-brief.md` and `prompt-brief-input.md`, and
  `review-brief-peer.md` and `review-brief-output.md`.
- The theme call (DS4a): `makeThemeSchema`, `prompt-theme.md` and its input,
  `buildTheme`, THEME-001 to 008, and the theme review guides.
- `briefSystemPrompt()`, `briefUserMessage(idea, scope)`,
  `themeSystemPrompt(brief, inv)`, `themeUserMessage(brief, scope, flows)`
  and the review guide loaders in `prompt.ts`, with tests.

## What this step does

1. **`src/stages/design/stage.ts`** with `runBrief(ctx)` and
   `runTheme(ctx, inv)`.
2. **Registers `brief` and `theme` as pipeline stages** before `design`, as
   the flows have their catalog and expand stages: each artifact is checked
   for staleness on its own, and a rerun of the theme keeps the brief. Step
   21 registers `design` for the IA and nodes calls.
3. **Runs the golden freelancer workspace** to a brief and a theme with zero
   mandatory issues.

## Implementation details

### `runBrief(ctx)`

`runSpecStage` with:

- `schema: Brief`;
- `system: briefSystemPrompt()` and `user: briefUserMessage(idea, scope)`;
- `validate: (brief) => validateBrief(brief, scope)`;
- `review: briefReviewGuides()`;
- `reasoningEffort: 'high'` and `temperature: 0.7` (D1.13 C: the first
  draft at 0.7, fixes and reviewers at 0.2).

Then `writeArtifact(run, 'brief', brief, { inputs: ['scope'] })`.

### `runTheme(ctx)`

`runSpecStage` with:

- `schema: makeThemeSchema(brief, inv)`;
- `system: themeSystemPrompt(brief, inv)` and
  `user: themeUserMessage(brief, scope, flows)`;
- `validate: (call) => validateTheme(buildTheme(brief, call), inv)`;
- `review: themeReviewGuides()`;
- `reasoningEffort: 'medium'`, temperature left at 0.2.

Then `writeArtifact(run, 'theme', buildTheme(brief, output), { inputs:
['brief', 'scope', 'flows'] })`.

### Tests

`stage.test.ts` with a fake llm scripted from the reading-list brief and
theme: both artifacts are written, the brief's first call is at high and
0.7, and the theme's at medium and 0.2.

## Done when

```sh
pnpm weave run fixtures/ideas/freelancer-workspace.md --to design   # a brief and a theme with zero mandatory issues
pnpm test -- src/stages/design
```

## Watch out

- The run needs the user's go (a live model run).
- The theme call's input carries each flow's header, not its steps.
