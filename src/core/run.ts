import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

export type StageStatus = 'pending' | 'running' | 'done' | 'failed';
export type StageState = {
  status: StageStatus;
  version?: number;
  hash?: string;
  rounds?: number;
  /** Mandatory issues and reviewer blockers left after the last round (D1.12). */
  known?: number;
  updatedAt: string;
};
export type RunState = {
  id: string;
  idea: string;
  createdAt: string;
  stages: Record<string, StageState>;
};
export type Run = { id: string; dir: string };

export type EventInput = { type: string; stage?: string } & Record<string, unknown>;
export type Event = EventInput & { ts: string };

export const DEFAULT_RUNS_DIR = 'runs';

/** `yyyymmdd-HHmm-<kebab idea basename>`, local time. */
export function runId(ideaPath: string, now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}`;
  const base = path.basename(ideaPath, path.extname(ideaPath));
  const kebab = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${date}-${time}-${kebab}`;
}

export function createRun(opts: { idea: string; runsDir?: string; id?: string }): Run {
  const id = opts.id ?? runId(opts.idea);
  const dir = path.join(opts.runsDir ?? DEFAULT_RUNS_DIR, id);
  if (existsSync(dir)) throw new Error(`Run ${id} already exists at ${dir}`);
  mkdirSync(path.join(dir, 'input'), { recursive: true });
  copyFileSync(opts.idea, path.join(dir, 'input', 'idea.md'));
  const state: RunState = { id, idea: opts.idea, createdAt: new Date().toISOString(), stages: {} };
  writeJsonAtomic(path.join(dir, 'state.json'), state);
  return { id, dir };
}

export function openRun(id: string, runsDir = DEFAULT_RUNS_DIR): Run {
  const dir = path.join(runsDir, id);
  if (!existsSync(path.join(dir, 'state.json'))) throw new Error(`No run ${id} in ${runsDir}`);
  return { id, dir };
}

export function runPath(run: Run, ...parts: string[]): string {
  return path.join(run.dir, ...parts);
}

export function readState(run: Run): RunState {
  return JSON.parse(readFileSync(runPath(run, 'state.json'), 'utf8')) as RunState;
}

export function updateStage(run: Run, stage: string, patch: Partial<StageState>): void {
  const state = readState(run);
  const current: StageState = state.stages[stage] ?? { status: 'pending', updatedAt: '' };
  state.stages[stage] = { ...current, ...patch, updatedAt: new Date().toISOString() };
  writeJsonAtomic(runPath(run, 'state.json'), state);
}

export function appendEvent(run: Run, event: EventInput): void {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...event });
  appendFileSync(runPath(run, 'events.jsonl'), `${line}\n`);
}

export function readEvents(run: Run): Event[] {
  const file = runPath(run, 'events.jsonl');
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Event);
}

/** Sums the `llm:call` events. */
export function totals(run: Run): { calls: number; input: number; output: number; costUsd: number } {
  const sum = { calls: 0, input: 0, output: 0, costUsd: 0 };
  for (const event of readEvents(run)) {
    if (event.type !== 'llm:call') continue;
    sum.calls += 1;
    sum.input += asNumber(event.input);
    sum.output += asNumber(event.output);
    sum.costUsd += asNumber(event.costUsd);
  }
  return sum;
}

function asNumber(value: unknown): number {
  return typeof value === 'number' ? value : 0;
}

/** Writes `<file>.tmp` then renames, so a reader never sees a half-written file. */
export function writeJsonAtomic(file: string, value: unknown): void {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(`${file}.tmp`, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(`${file}.tmp`, file);
}
