# 46 · FE6 Visual rubric (optional)

Phase 7 · 45 min · Depends: FE5 · Decisions: D3.7 C, D3.8 A · Spec:
specs/design.md "Visual rubric"

## Goal

A vision call scores each route's screenshot 0 to 4 per concern with
evidence; warnings only, a tuning signal and demo material.

## What this step does

1. **Screenshots of every route** go to the vision model with the screen's
   purpose; it scores eight design concerns 0 to 4 and must name the screen,
   the element and the reason for each issue.
2. **Warnings only**: a report for tuning and the demo, never a gate.
3. **The model client learns image parts** in messages.

After this step there is a design-quality signal beyond what rules can
measure. Optional; first on the cut list.

## Implementation details

1. Step 03's `ChatMessage.content` becomes `string | ContentPart[]` with
   `{ type: 'text', text }` and `{ type: 'image_url', image_url: { url } }`
   (the OpenAI shape; data URLs with base64 PNG). The replay key hashes the
   parts as given.
2. `src/checks/rubric.ts`: take 1280 and 375 screenshots per route (from
   the rendered-check pages), send them with the screen's purpose and
   states to `LLM_MODEL_VISION` with the schema
   `{ scores: [{ concern: enum(emphasis, focalPoints, overwhelm, density, whitespace, taskClarity, recovery, coherence), score: int 0..4, evidence: [{ screen, element, reason }] }] }`;
   reject (as a validator warning) any evidence without an element.
3. `reports/rubric.json` and a section in `05-benchmark.md` (step 54 reads
   it when present). Average per route and overall; 3 or more is the
   target, never a gate.

## Done when

`reports/rubric.json` exists for the freelancer workspace with a score per
concern per route; `pnpm weave show <id>` prints the overall average.

## Watch out

- Confirm `muse-spark-1.3` accepts image parts in the smoke test before
  wiring the stage; if not, this step is cut.
