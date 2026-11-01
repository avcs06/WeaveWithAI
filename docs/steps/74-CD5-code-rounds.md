# 74 · CD5 Code rounds in the stage runner

Phase 6 · 2.5 h · Depends: CD2, FE1 · Decisions: D9.1 A, D1.6, D1.12 (notes
2026-11-01), D7.4 · Spec: ARCHITECTURE.md "Stage runner"

## Goal

A coding unit (a page, the frames, the shared pieces) runs through the same
`runSpecStage` as every spec stage. Its draft and its fixes are Muse Code
sessions, its validators are the checks run after each session, and two
reviewers read its diff from round 1.

## What this step does

1. **The runner learns a schedule per stage.** Spec stages keep D1.12's.
   Code units use three rounds:
   - Round 1: the session, the checks, both reviewers.
   - Round 2: a fix session for every failed check and blocker, the checks,
     both reviewers.
   - Round 3: a final fix session and the checks.
   What is left is known; the run goes on.
2. **Reviewers in round 1.** A fix session costs about $0.5 to $1 and a
   review about $0.07, so both reviewers' blockers join the first fix.
3. **Output reviewers as a list.** A code unit has two output reviewers
   (CD6) and no peer. The failed checks reach them as known issues.
4. **A session `Compose`.** Draft: a session with the unit's task. Fix: a
   session with the pending issues; the agent ranks them and fixes the
   blockers (CD2's guidelines). The text the reviewers read is the unit's
   whole diff since its baseline, plus the agent's summary.
5. **Checks become issues with rule ids**, so the report, the fix message
   and `weave show` treat them like validator issues. The split (user,
   2026-11-01): a check that needs no browser, no Storybook and no idea
   context runs in the design-system MCP on the code alone, while the agent
   writes. Every other check runs here, after the session. None of the
   checks below works on code alone, so the MCP's `validate` stays as it is
   and no app MCP is needed.
6. **Write paths instead of a protect list.** Each session names the paths
   it may write; any other path, or a test, fails CODE-004.
7. **One runner per unit**, named like draw's: `code-pages-S04`.

## Before you start

- `runSpecStage` (`src/runner/runSpecStage.ts`): `SCHEDULE`, `Compose`,
  `ReviewGuides { peer?, output }`, `review()` with `prompt-review.md` and
  `prompt-review-input.md` (it fences the output as JSON).
- `runSession` (`src/engine/session.ts`) already runs the session, records
  the ledger and runs validate, typecheck, lint, verify and the design
  check. A passing session is committed in the app; a failing one is
  committed as the inputs of the next session, so a fix's own diff starts
  clean. The unit's whole diff is `git diff <unit baseline> HEAD`.
- `checkScreen` (`src/engine/conformance.ts`) and `runRenderedChecks`
  (`src/checks/index.ts`, DESIGN-R-001 to 009).

## Implementation details

### Runner options

```ts
type SpecStageOptions<T> = {
  …
  schedule?: Round[];                    // default: D1.12's
  review?: { peer?: string; output: string | string[] };
  reviewInput?: string;                  // the review user message template; default prompt-review-input.md
};
type Round = { fix: boolean; reviewers: ('peer' | 'output')[] };
export const CODE_SCHEDULE: Round[];     // the three rounds above
```

### Checks as issues (`src/engine/checks.ts`)

| Rule | Severity | Check |
| --- | --- | --- |
| CODE-001 | mandatory | MCP validate on every changed source file |
| CODE-002 | mandatory | `pnpm typecheck` |
| CODE-003 | mandatory | `pnpm nx lint web` |
| CODE-004 | mandatory | a write outside the session's paths, or a test |
| CODE-005 | mandatory | a design node with no element carrying its `data-testid` |
| CODE-006 | mandatory | an operation the unit's widgets read that nothing calls (the id or its `use` hook) |
| CODE-007 | mandatory | `pnpm verify <route>` |
| CODE-008 | mandatory | `next build`, once after the last page |

The rendered checks on a route keep their own ids and severities:
DESIGN-R-001 axe, 002 contrast, 003 keyboard walk, 004 target sizes, 005
to 009 as in the design spec.

`validate` stays pure: the session runs the checks, the draft carries their
results, and `validate` turns them into issues.

```ts
// src/engine/compose.ts
export function sessionCompose(ctx: StageContext, appDir: string, unit: Unit): Compose<UnitResult>;
export type Unit = { id: string; task: string; route?: string; expect?: ScreenExpect; writes: string[] };
export type UnitResult = { checks: Check[]; rendered: Issue[]; diff: string; summary: string };
```

## Tests

With a fake `muse` and fake checks:

1. A unit failing typecheck in round 1 gets one fix session carrying the
   CODE-002 issue and both reviewers' blockers, and ends clean in round 2.
2. A unit still failing after round 3 records known issues and returns;
   the run goes on.
3. A write outside `writes` fails CODE-004.
4. A spec stage without `schedule` runs exactly as before (the existing
   runner tests pass unchanged).
5. The reviewers of a code unit see the diff and the failed checks.

## Done when

```sh
pnpm typecheck && pnpm test
```

## Watch out

- A fix session must not undo the earlier session's work: its task names
  the issues, the files they are in, and the unit's guidelines.
- Spec stages' schedule, events and reports must not change.
