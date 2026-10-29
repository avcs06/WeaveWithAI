# 05 · F5 Runs, artifacts, events, issues

Phase 1 · 40 min · Depends: F1 · Decisions: D1.9 · Spec: ARCHITECTURE.md
"Run folder", "Artifact envelope", "Issues"

## Goal

The on-disk shape every stage reads and writes: a run folder, versioned and
hashed artifacts, an event log, and the issue type with its reports.

## What this step does

1. **A run folder per generator run**, named by date, time and the idea, with
   the idea copied in and a `state.json` that says what each stage did.
2. **Artifacts** (scope, flows, screens, contract, ...) are written as JSON
   inside an envelope that records a version, a content hash, and the
   versions and hashes of the artifacts it was made from. Writes are atomic.
3. **Staleness follows from the envelopes**: when an input changed after an
   artifact was made, the artifact is stale and `weave run` redoes it in
   pipeline order. Nothing downstream can silently use old inputs.
4. **An event log** with one JSON line per thing that happens (stage start,
   round, model call with tokens and cost, check run) feeds `show`, the
   dashboard and the cost numbers.
5. **Issues** are the one shape every validator returns: rule id, severity,
   message, where. Reports per stage and round go to disk; formatting exists
   for the model (mandatory issues only) and for the terminal.
6. **Tests** for hashing, versions, staleness, events and issues.

After this step every stage has the same way to read inputs, write outputs
and report problems.

## Before you start

- `runs/` is gitignored. Run IDs look like `20261028-2010-freelancer-workspace`.
- Everything here is plain `node:fs` and `node:crypto`; no model, no network.

## Implementation details

### 1. `src/core/run.ts`

```ts
export type StageStatus = 'pending' | 'running' | 'done' | 'failed';
export type RunState = {
  id: string;
  idea: string;                         // path given on the command line
  createdAt: string;
  stages: Record<string, { status: StageStatus; version?: number; hash?: string; rounds?: number; updatedAt: string }>;
};
export type Run = { id: string; dir: string };

export function runId(ideaPath: string, now = new Date()): string;   // yyyymmdd-HHmm-<kebab basename>
export function createRun(opts: { idea: string; runsDir?: string; id?: string }): Run;   // copies the idea to input/idea.md, writes state.json
export function openRun(id: string, runsDir?: string): Run;           // throws if missing
export function runPath(run: Run, ...parts: string[]): string;
export function readState(run: Run): RunState;
export function updateStage(run: Run, stage: string, patch: Partial<RunState['stages'][string]>): void;
export type Event = { ts: string; type: string; stage?: string } & Record<string, unknown>;
export function appendEvent(run: Run, event: Omit<Event, 'ts'>): void;   // one JSON line in events.jsonl
export function readEvents(run: Run): Event[];
export function totals(run: Run): { calls: number; input: number; output: number; costUsd: number };  // from llm:call events
```

Event types used by the following steps: `stage:start`, `stage:round`
(`round`, `mandatory`, `warnings`), `stage:done`, `stage:failed`, `llm:call`
(`backend`, `model`, `input`, `cachedInput`, `output`, `costUsd`, `replayed`,
`durationMs`), `check:run` (`name`, `ok`, `durationMs`), later `bench:*`.

### 2. `src/core/artifacts.ts`

```ts
export type ArtifactName = 'scope' | 'flows' | 'brief' | 'theme' | 'screens' | 'contract' | 'matrix';
export type Envelope<T> = { meta: {...as in ARCHITECTURE}; data: T };

export function canonicalJson(value: unknown): string;      // sorted keys at every level, no whitespace
export function hashOf(value: unknown): string;             // sha256 hex of canonicalJson
export function writeArtifact<T>(run: Run, name: ArtifactName, data: T, meta: { stage: string; model: string | null; rounds: number; inputs: ArtifactName[] }): Envelope<T>;
export function readArtifact<T>(run: Run, name: ArtifactName): Envelope<T>;   // throws a clear error when missing
export function hasArtifact(run: Run, name: ArtifactName): boolean;
export function isStale(run: Run, name: ArtifactName): boolean;   // any inputs[x].hash differs from the current hash of x
```

File names: `01-scope.json`, `01-flows.json`, `02-brief.json`, `02-theme.json`,
`02-screens.json`, `03-contract.json`, `04-matrix.json`, through one
`FILE_OF: Record<ArtifactName, string>`. `writeArtifact` sets `version` to
the previous version plus one (1 when new), `hash = hashOf(data)`, `inputs`
from the current envelopes of the named inputs, `createdAt` ISO, and updates
`state.json` for the stage. Writes are atomic: write `<file>.tmp`, then
`renameSync`.

### 3. `src/core/issues.ts`

```ts
export type Issue = { rule: string; severity: 'mandatory' | 'warning'; message: string; at?: string; owner?: 'flows' | 'design' | 'contract' };
export function splitIssues(issues: Issue[]): { mandatory: Issue[]; warnings: Issue[] };
export function writeReport(run: Run, stage: string, round: number, issues: Issue[]): void;   // reports/<stage>.json: { rounds: [{ round, issues }] }
export function readReport(run: Run, stage: string): { rounds: { round: number; issues: Issue[] }[] } | undefined;
export function formatForModel(issues: Issue[]): string;   // "- RULE at F03.S02: message" per line, mandatory only
export function formatForTerminal(issues: Issue[]): string; // grouped by severity, counts first
```

### 4. Tests (`run.test.ts`, `artifacts.test.ts`, `issues.test.ts`)

Temp `runsDir` per test. Cases:

1. `hashOf({ a: 1, b: [1, { c: 2 }] })` equals `hashOf({ b: [1, { c: 2 }], a: 1 })`.
2. `writeArtifact` twice: versions 1 then 2; the second envelope's `inputs`
   carry the first artifact's version and hash when named.
3. Staleness: write `scope`, write `flows` with input `scope`, rewrite
   `scope` with different data → `isStale(run, 'flows')` is true; rewrite the
   same data → false.
4. `appendEvent` three times → `readEvents` returns three in order; `totals`
   sums `llm:call` events only.
5. `splitIssues` separates severities; `formatForModel` lists only mandatory
   issues, one per line, with `at` when present.
6. `writeReport` for rounds 1 and 2 → `readReport` has both.

## Done when

```sh
pnpm test -- src/core     # all core tests pass
pnpm typecheck
```

## Watch out

- Canonical JSON must sort keys recursively, including inside arrays of
  objects; `JSON.stringify` with a sorted replacer handles both.
- The `Run` object is just `{ id, dir }`; no in-memory state, so stages can
  be rerun from another process.
