# 61 · P3 README and submission answers

Phase 10 · 90 min · Depends: P2 · Decisions: D12.2 · Spec: docs/README.md
"Facts" (the rules on new work, the form's questions)

## Goal

A README a judge can read in five minutes that says what Weave is, shows
the numbers, states the gaps, and separates this week's work from the
pre-existing design system (the rules disqualify entries that don't); plus
the form's written answers ready to paste.

## What this step does

1. **The README is rewritten for a judge with five minutes**: what Weave is,
   what was built this week versus what existed before (the rules require
   this to be unmistakable), the pipeline, the numbers from step 60, how to
   run it, the gaps.
2. **The submission answers** are drafted in a file: track, problem
   statement, description, use of Meta products, why Meta's models matter,
   feedback.

After this step the written part of the submission is done.

## Implementation details

### 1. Root `README.md`

Sections, in this order:

1. **Weave in one paragraph** and the one-line approach (models write
   specifications; code generates, checks and ships).
2. **What was built during the hackathon (Oct 27 to Nov 4, 2026)**: the
   generator (`src/`: every stage, validators, codegen, the action loop,
   the benchmark, tests and repair), the changes to `template/` and
   `mcps/` made this week (list them from `git log --since=2026-10-27
   --oneline -- template mcps`), the docs. Name the commit range.
3. **What existed before**: the design system (`template/packages/*`, the
   `web` starter, `tools/`, `mcps/frontend`) with its own history
   (`git log --until=2026-10-26 --oneline | tail -1` for the first commit),
   in two sentences. No apology, just the line.
4. **Pipeline**: the ARCHITECTURE diagram, and one paragraph per phase
   with links to the artifacts of a real run (`runs/` is gitignored, so
   copy the freelancer workspace's rendered markdowns and `05-benchmark.md`
   into `docs/examples/freelancer-workspace/`).
5. **Numbers**: the P2 table; the benchmark summary for both apps; lines
   by origin.
6. **Meta tooling**: models per stage, structured output, the Modal run
   with the model name and where it ran, the Muse Spark image calls if
   used.
7. **Run it**: the quick start (install, `.env`, `pnpm weave run …`,
   `pnpm weave show --html`).
8. **Gaps and next**: parked backend and deployment, navigation models
   rendered as a top bar, no CSP, anything the benchmark flags.

### 2. `docs/SUBMISSION.md`

The form's fields with the answers: team name; track (Indie Developer);
problem statement (Build for Your World) with one sentence why; project
description (under 150 words, the problem it solves); public repository
URL; video URL (filled in step 62); "Describe your use of Meta products"
(models, structured output, the open-weight run); "Why are Meta's models
important to your solution?" (constrained decoding on every stage,
cost, the open-weight path); feedback on Meta products (what worked,
what didn't, from `ARCHITECTURE.md` findings); feedback on partner
technologies (Modal). Plain sentences, no em dashes.

## Done when

A reader of the README alone can tell what was built this week, how the
pipeline works and what the numbers are; `docs/SUBMISSION.md` has every
required answer under the form's limits.
