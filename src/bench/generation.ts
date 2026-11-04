import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { PIPELINE } from '../agents/stages';
import { type Event, readEvents, readState, type Run, runPath } from '../core/run';
import type { Thread } from '../runner/threads';

// How the run made the app, from its own events, state and threads: time,
// spend, tokens, rounds, and what the checks and the review agents caught and
// the fix sessions closed. No browser and no model.

/** A reviewer's threads: a fix is checked when a review read the round it closed in; round 3's fix nobody reads. */
export type ReviewCount = { reviewer: string; part: 'planning' | 'code'; caught: number; fixed: number; unchecked: number; open: number; threads: number };

/** Every issue an agent raised, and the threads among them: issues a reply kept open. */
export type ThreadCount = { issues: number; threads: number };

export type GenerationReport = {
  backend: string;
  agent: 'Muse Code' | 'OpenCode';
  models: { model: string; calls: number }[];
  timeMs: { total: number; planning: number; code: number; stages: { stage: string; ms: number }[] };
  calls: number;
  tokensIn: number;
  tokensCached: number;
  tokensOut: number;
  costUsd: number;
  /** The Muse Code subscription's weekly allowance, in percent, before the run's first session and after its last. */
  subscription?: { weekFrom?: number; weekTo: number };
  rounds: number;
  known: number;
  review: ReviewCount[];
  threads: ThreadCount;
};

type Call = Event & { model?: string; backend?: string; calls?: number; input?: number; cachedInput?: number; output?: number; costUsd?: number; billing?: string; allowance?: { week: number } };

const at = (event: Event) => Date.parse(event.ts);

/** First start to last done of each stage, and the two spans the apps are compared on: scope to contract, frames to pages. */
function times(events: Event[]): GenerationReport['timeMs'] {
  const spans = new Map<string, { start: number; done: number }>();
  for (const event of events) {
    if (!event.stage || !PIPELINE.includes(event.stage)) continue;
    const span = spans.get(event.stage) ?? { start: Infinity, done: 0 };
    if (event.type === 'stage:start') span.start = Math.min(span.start, at(event));
    if (event.type === 'stage:done') span.done = Math.max(span.done, at(event));
    spans.set(event.stage, span);
  }
  const between = (from: string, to: string) => Math.max(0, (spans.get(to)?.done ?? 0) - (spans.get(from)?.start ?? Infinity));
  // From the first stage's start to the last stage's end: later events, such as a benchmark's, are not the run's.
  const start = Math.min(...[...spans.values()].map((s) => s.start));
  const done = Math.max(0, ...[...spans.values()].map((s) => s.done));
  return {
    total: done > start ? done - start : 0,
    planning: between('flows-scope', 'contract'),
    code: between('code-frames', 'code-pages'),
    stages: [...spans].filter(([, s]) => s.done > s.start).map(([stage, s]) => ({ stage, ms: s.done - s.start })),
  };
}

/** Every subscription reading of every run, oldest first, so a run's starting allowance is the last reading before it. */
function allowanceReadings(runsDir: string): { ts: string; run: string; week: number }[] {
  if (!existsSync(runsDir)) return [];
  const readings = readdirSync(runsDir).flatMap((id) =>
    readEvents({ id, dir: path.join(runsDir, id) })
      .filter((e): e is Call => e.type === 'llm:call' && (e as Call).billing === 'subscription' && Boolean((e as Call).allowance))
      .map((e) => ({ ts: e.ts, run: id, week: e.allowance!.week })),
  );
  return readings.sort((a, b) => a.ts.localeCompare(b.ts));
}

/** The `stage:round`s an event type covers: a review read that round's fix, or the validators ran on it. */
function roundsOf(events: Event[], type: string): Set<string> {
  return new Set(events.filter((e) => e.type === type).map((e) => `${e.stage}:${e.round}`));
}

/**
 * Threads per reviewer: `review-ux-2` counts as ux, `checks` are the validators' mandatory issues. A closed thread is
 * fixed when something looked at the round its closing began in: the validators for a check, a review for a blocker.
 */
export function reviewCounts(threadsByStage: Record<string, Thread[]>, reviewed: Set<string>, validated: Set<string>): ReviewCount[] {
  const counts = new Map<string, ReviewCount>();
  for (const [stage, threads] of Object.entries(threadsByStage)) {
    const part = stage.startsWith('code-') ? 'code' : 'planning';
    for (const thread of threads) {
      const reviewer = thread.by.replace(/^review-/, '').replace(/-\d+$/, '');
      const count = counts.get(`${part}:${reviewer}`) ?? { reviewer, part, caught: 0, fixed: 0, unchecked: 0, open: 0, threads: 0 };
      count.caught += 1;
      if (keptOpen(thread)) count.threads += 1;
      // A fix session may answer a closed thread again in a later round; the closing began at the first of those.
      const reopened = thread.entries.findLastIndex((e) => e.status !== 'closed');
      const closing = thread.entries[reopened + 1];
      const looked = reviewer === 'checks' ? validated : reviewed;
      if (!closing) count.open += 1;
      else if (looked.has(`${stage}:${closing.round}`)) count.fixed += 1;
      else count.unchecked += 1;
      counts.set(`${part}:${reviewer}`, count);
    }
  }
  return [...counts.values()];
}

/** A thread: a reply kept the issue open. One raised and closed by the next fix is a fixed issue, not a conversation. */
const keptOpen = (thread: Thread) => thread.entries.some((e) => e.status === 'open');

export function threadCount(threadsByStage: Record<string, Thread[]>): ThreadCount {
  const issues = Object.values(threadsByStage).flat();
  return { issues: issues.length, threads: issues.filter(keptOpen).length };
}

function readThreads(run: Run): Record<string, Thread[]> {
  const dir = runPath(run, 'reports');
  if (!existsSync(dir)) return {};
  const files = readdirSync(dir).filter((file) => file.endsWith('.threads.json'));
  return Object.fromEntries(files.map((file) => [file.replace('.threads.json', ''), JSON.parse(readFileSync(path.join(dir, file), 'utf8')) as Thread[]]));
}

export function readGeneration(run: Run, runsDir: string): GenerationReport {
  const events = readEvents(run);
  const calls = events.filter((e): e is Call => e.type === 'llm:call');
  const models = new Map<string, number>();
  for (const call of calls) models.set(call.model ?? '?', (models.get(call.model ?? '?') ?? 0) + (call.calls ?? 1));
  const sum = (pick: (call: Call) => number | undefined) => calls.reduce((total, call) => total + (pick(call) ?? 0), 0);

  const readings = allowanceReadings(runsDir);
  const mine = readings.filter((r) => r.run === run.id);
  const before = mine[0] && readings.filter((r) => r.ts < mine[0]!.ts).at(-1);
  const state = readState(run).stages;
  const threads = readThreads(run);
  const top = PIPELINE.map((stage) => state[stage]).filter((s) => s !== undefined);

  return {
    backend: calls[0]?.backend ?? '?',
    agent: existsSync(runPath(run, 'opencode')) ? 'OpenCode' : 'Muse Code',
    models: [...models].map(([model, n]) => ({ model, calls: n })).sort((a, b) => b.calls - a.calls),
    timeMs: times(events),
    calls: sum((c) => c.calls ?? 1),
    tokensIn: sum((c) => c.input),
    tokensCached: sum((c) => c.cachedInput),
    tokensOut: sum((c) => c.output),
    costUsd: sum((c) => c.costUsd),
    ...(mine.length && { subscription: { ...(before && { weekFrom: before.week }), weekTo: mine.at(-1)!.week } }),
    rounds: top.reduce((n, s) => n + (s.rounds ?? 0), 0),
    known: top.reduce((n, s) => n + (s.known ?? 0), 0),
    review: reviewCounts(threads, roundsOf(events, 'review:start'), roundsOf(events, 'round:validated')),
    threads: threadCount(threads),
  };
}
