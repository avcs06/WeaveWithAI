# 71 · CD2 The `.weave` folders

Phase 6 · 2 h · Depends: CD1 · Decisions: D9.1 A, D7.1 B ·
Spec: ARCHITECTURE.md "Generated app"

## Goal

The scaffold writes everything the coding sessions read into the app's
`.weave/`, one numbered folder per code stage. Each folder holds its
stage's guidelines and inputs. A session reads its own folder and the
earlier ones, and a page reads only its own screen's folder.

## What this step does

1. **One folder per stage, numbered in pipeline order.** `01-scaffold/`
   holds what every session needs; `02-contract/` to `05-pages/` hold what
   their stage needs. A page's inputs sit in `05-pages/<screen>/`.
2. **Slices, not whole artifacts.** Code cuts each unit's part out of the
   run's artifacts: a component's design, a shared widget's nodes, a
   shell, a page with its dialogs. The session's context then holds only
   what it builds.
3. **Each folder has its guidelines**, copied from its stage's
   `prompts/guidelines.md`. This step writes the guidelines of
   `01-scaffold/`; the stage tasks (CD4, CD7, CD8, CD9) write theirs.
4. **Questions, answers and known issues travel with the slices.** Every
   question of scope, flows and design comes with its answer, and every
   issue the spec stages left goes to the unit its `at` names.
5. **The app-wide guidelines say how to treat them.** The design may hold
   errors: the agent makes its own call and lists it. The agent ranks the
   questions and known issues first and fixes only blockers.

## Before you start

- FE8's single input file was `.weave/screens/S04.json`; `src/engine/guidelines.md`
  (FE9) is the text that passed the gate. This step's app-wide guidelines
  replace it, and `prepareApp` stops copying it.
- Known issues are the last round of each spec stage's report
  (`reports/<stage>.json`): its mandatory issues and `REVIEW` blockers.
  Warnings stay out.
- Questions: `scope.questions`, `flows.questions` and the design's
  `questions`, each with `defaultAnswer`; answers given are in
  `input/answers.json`.
- `.weave/**` is protected in `runSession`, so the agent cannot change its
  inputs.

## Implementation details

### The folders

```text
.weave/
  01-scaffold/
    guidelines.md       rules for every session (below)
    scope.json  flows.json  theme.json  contract.json
    routes.json         every screen: id, name, route, parent, access
    issues.json         questions with answers, and known issues no unit owns
  02-contract/          guidelines.md and entities.md (CD4)
  03-shared/
    components/<Name>.json   each new component's design
    widgets/<W01>.json       each widget on two or more screens: its catalog entry, nodes, slots, screens
    issues.json
  04-frames/
    shells/<SH1>.json        each shell: regions, nodes, the screens it frames
    navigation.json  frame-changes.json
    issues.json
  05-pages/
    <S04>/page.json          the page and its dialogs: sections, placements, the nodes of its
                             single-use widgets, the shared widgets it places by name, the steps
                             and alternatives it serves, the operations its widgets read
    <S04>/issues.json
```

`issues.json` is `{ questions: { id, question, answer, from }[], known: { stage, rule, at, message }[] }`.

### Who owns an issue

An `at` of a screen, section or node goes to its page (a dialog's to its
parent page); a widget's to `03-shared` when the widget is shared, else to
its page; a shell's or region's to `04-frames`; a step's to every unit
whose nodes serve it; a new component's to `03-shared`. Anything else goes
to `01-scaffold`.

```ts
// src/agents/04code/01scaffold/weave.ts
export function weaveFolders(inputs: CodeInputs): Map<string, string>;   // pure: path under .weave/ to file text
export function issueOwner(at: string, design: Screens, shared: Set<string>): string;   // the folder an issue goes to
export function writeWeave(appDir: string, files: Map<string, string>): void;
```

The stage calls `writeWeave` after `prepareApp`, so the baseline commit
holds the inputs.

### `src/agents/04code/01scaffold/prompts/guidelines.md`

Short statements, do-first, as AGENTS.md asks of AI-read text:

- Read your task first. Then this file, then the `guidelines.md` of every
  folder your task names, in number order. Read only the folders your task
  names.
- Get and change data only through `web/app/entities/` (`02-contract/`).
  Never change it.
- Every design node is an element whose root has `data-testid` set to the
  node id. Show the node's words. Build every state it lists.
- The design may hold errors: a missing state, a wrong word, a control that
  opens nothing, a step no control serves, a box that cannot fit. When
  something is wrong, make your own call. Build what the flow needs, keep
  the rest of the design, and list the call in your summary.
- `issues.json` lists questions with their answers and the issues earlier
  stages left. Rank them before you build. A blocker stops a flow step from
  working, shows wrong data or wrong words, or breaks a check. Fix only
  blockers, and say which you left. In a fix task every failed check is a
  blocker.
- Never write or change a test. Write only inside your stage's paths; the
  stage's guidelines name them.
- Finish with `pnpm typecheck`, `pnpm nx lint web`, and `pnpm verify
  <route>` when your task names a route. Fix until they pass.
- End with a summary in four parts: `## Priorities` (each question and
  known issue: blocker or not, fixed or left), `## Calls` (each design
  error and what you built instead), `## Files`, `## Not built`.

## Tests

On the golden freelancer workspace set:

1. Every folder is written, with its guidelines where the stage has them.
2. `05-pages/S04/page.json` holds S04's nodes and no node of another page.
3. W01 and W29 (on several screens) are in `03-shared/widgets/`, and no
   page slice holds their nodes.
4. `issueOwner`: a node goes to its page, a dialog's node to its parent
   page, `SH1.r2` to frames, an unknown id to `01-scaffold`.
5. The guidelines fill and hold no placeholder.

## Done when

```sh
pnpm typecheck && pnpm test
```

and a scaffold rerun on `20261101-0150-freelancer-workspace` writes the
tree (ask first).

## Watch out

- The agent can read any file in the app, so "read only the folders your
  task names" is a rule, not a wall. CD5's write paths make reading ahead
  harmless: a session that writes outside its paths fails.
- Keep slices small: the cost of every call grows with what the session
  has read.
