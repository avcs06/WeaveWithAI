# 79 · CD10 Golden apps end to end

Phase 6 · 1.5 h · Depends: CD9 · Gates: G5, G6

## Goal

The code stages build two golden apps from their spec artifacts with no
manual edit: the dashboard editor first, the smallest, then the freelancer
workspace.

## What this step does

1. **The dashboard editor** runs from `code-scaffold` to `code-pages` on
   its golden run (about $8 to $12).
2. **Fixes found on the way** go into the generator and the guidelines,
   then the stage reruns.
3. **The freelancer workspace** runs the same way (about $20 to $28).
4. **Every flow is walked by hand** on each app.
5. **The numbers** go into `fixtures/golden/README.md` under "Generated
   app": cost and time per stage and per unit, rounds, known issues, files
   and lines by origin.

## Implementation details

```sh
pnpm weave run fixtures/ideas/dashboard-editor.md --run 20261101-0107-dashboard-editor --from code-scaffold
pnpm weave run fixtures/ideas/freelancer-workspace.md --run 20261101-0150-freelancer-workspace --from code-scaffold
```

Each run spends credits: ask before each one, and report a failed run
instead of retrying it.

## Done when

- **G5**: the freelancer workspace is scaffolded with its theme, its
  `.weave/` folders and its entity layer; the app builds.
- **G6**: both apps are built by the code stages; every route passes its
  checks, or its known issues are recorded; every flow works by hand.

## Watch out

- The FE8 trial app in `20261101-0107-dashboard-editor/app` is in the way:
  move it aside before the scaffold, never delete it unasked.
