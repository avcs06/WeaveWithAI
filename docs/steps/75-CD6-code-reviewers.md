# 75 · CD6 Code reviewers

Phase 6 · 1 h · Depends: CD5 · Decision: D1.12 (notes 2026-11-01)

## Goal

Two output reviewers read every coding unit's diff, each with its own
focus. Clean, readable, well-organized code is the product's selling point
(user, 2026-11-01), so one reviewer looks only at that.

## What this step does

1. **The code reviewer** checks quality, readability and organization: the
   template's folders and import direction, a component per concern, clear
   names, small files, no duplicated code, styles in `.css.ts`, nothing
   dead.
2. **The adherence reviewer** checks the diff against the design, the
   theme and the behavior: the design's nodes, words and states; the
   theme's defaults and looks; every flow step and alternative the unit
   serves; data through the contract's operations.
3. **Neither repeats the checks.** The failed checks come in as known
   issues. Accessibility, keyboard and contrast are tool checks (DESIGN-R),
   and performance is the benchmark's.
4. **The agent's calls count.** The reviewers read the agent's summary. A
   design error the agent called and built around is not a blocker when the
   call is sound.

## Before you start

- `src/runner/prompt-review.md` holds the shared rules (major blockers
  only, be lenient, the answer format); a guide sets the persona and what
  to look for.
- CD5 gives `runSpecStage` a list of output guides and a `reviewInput`.

## Implementation details

```text
src/agents/04code/prompts/
  review-code.md          the code reviewer's guide
  review-adherence.md     the adherence reviewer's guide
  review-input.md         the review user message: the task, the unit's .weave files,
                          the agent's summary, the diff (fenced as diff), the known issues
src/agents/04code/review.ts   codeReviewGuides(): string[]; fills review-input.md for a unit
```

- A blocker's `at` is a file path, with a line when it has one.
- Each guide names what is not a blocker: taste, a pattern the template
  already uses, anything a check covers.

## Tests

1. Both guides and the input fill from a sample unit and diff, with no
   placeholder left.
2. A blocker from a fake reviewer reaches the next fix session's task.

## Done when

```sh
pnpm typecheck && pnpm test
```

## Watch out

- Keep each guide short and concrete; a long list makes every review
  slower and noisier.
