import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import type { Thread } from '../runner/threads';
import { readGeneration, reviewCounts, threadCount } from './generation';

const root = mkdtempSync(path.join(tmpdir(), 'weave-bench-gen-'));
afterAll(() => rmSync(root, { recursive: true, force: true }));

const issue = { rule: 'REVIEW', severity: 'mandatory' as const, message: 'x' };
const thread = (by: string, entries: [number, string, string][]): Thread => ({
  id: 'T01',
  issue,
  by,
  round: 1,
  entries: entries.map(([round, who, status]) => ({ id: 'T01', round, by: who, status: status as 'closed' | 'open', reason: 'r' })),
});

describe('reviewCounts', () => {
  it('counts a blocker fixed when a review read the round its closing began in, and unchecked when none did', () => {
    const counts = reviewCounts(
      {
        'code-pages': [
          thread('review-ux-2', [[2, 'fix', 'closed']]),
          thread('review-ux-4', [[3, 'fix', 'closed']]),
          thread('review-behavior', [[2, 'fix', 'open']]),
        ],
      },
      new Set(['code-pages:1', 'code-pages:2']),
      new Set(),
    );
    expect(counts).toEqual([
      { reviewer: 'ux', part: 'code', caught: 2, fixed: 1, unchecked: 1, open: 0, threads: 0 },
      { reviewer: 'behavior', part: 'code', caught: 1, fixed: 0, unchecked: 0, open: 1, threads: 1 },
    ]);
  });

  it('dates a check by its first closing reply and the validation of that round, though a later fix answers it again', () => {
    const counts = reviewCounts(
      { 'flows-scope': [thread('checks', [[2, 'fix', 'closed'], [3, 'fix', 'closed']]), thread('checks', [])] },
      new Set(),
      new Set(['flows-scope:2', 'flows-scope:3']),
    );
    expect(counts).toEqual([{ reviewer: 'checks', part: 'planning', caught: 2, fixed: 1, unchecked: 0, open: 1, threads: 0 }]);
  });
});

describe('threadCount', () => {
  it('counts every issue, and as threads only the ones a reply kept open; an issue closed by the next fix is none', () => {
    const counts = threadCount({
      contract: [
        thread('review-output', [[2, 'fix', 'closed'], [2, 'review-output', 'open'], [3, 'fix', 'closed']]),
        thread('review-code', [[3, 'fix', 'open']]),
        thread('review-peer', [[2, 'fix', 'closed'], [2, 'review-peer', 'closed']]),
        thread('checks', [[2, 'fix', 'closed']]),
      ],
    });
    expect(counts).toEqual({ issues: 4, threads: 2 });
  });
});

describe('readGeneration', () => {
  const runsDir = path.join(root, 'runs');
  const write = (id: string, file: string, value: unknown) => {
    mkdirSync(path.dirname(path.join(runsDir, id, file)), { recursive: true });
    const text = Array.isArray(value) && file.endsWith('.jsonl') ? value.map((v) => JSON.stringify(v)).join('\n') : JSON.stringify(value);
    writeFileSync(path.join(runsDir, id, file), text);
  };
  write('a-earlier', 'events.jsonl', [
    { ts: '2026-11-03T10:00:00.000Z', type: 'llm:call', stage: 'session:pages', billing: 'subscription', allowance: { week: 24, window: 1 } },
  ]);
  write('b-run', 'events.jsonl', [
    { ts: '2026-11-04T10:00:00.000Z', type: 'stage:start', stage: 'flows-scope' },
    { ts: '2026-11-04T10:01:00.000Z', type: 'llm:call', stage: 'flows-scope', backend: 'meta', model: 'muse-wonder-1.0', input: 100, cachedInput: 0, output: 10, costUsd: 0.5 },
    { ts: '2026-11-04T10:30:00.000Z', type: 'stage:done', stage: 'contract' },
    { ts: '2026-11-04T10:32:00.000Z', type: 'stage:start', stage: 'code-frames' },
    { ts: '2026-11-04T10:40:00.000Z', type: 'llm:call', stage: 'session:frames', backend: 'meta', model: 'muse-spark-1.3', calls: 9, input: 1000, cachedInput: 900, output: 50, costUsd: 0, billing: 'subscription', allowance: { week: 27, window: 3 } },
    { ts: '2026-11-04T11:32:00.000Z', type: 'stage:done', stage: 'code-pages' },
    { ts: '2026-11-04T15:00:00.000Z', type: 'bench:start' },
  ]);
  write('b-run', 'state.json', { id: 'b-run', idea: 'x', createdAt: '', stages: { 'code-pages': { status: 'done', updatedAt: '', rounds: 3, known: 2 }, 'flows-expand-1': { status: 'done', updatedAt: '', rounds: 5 } } });
  write('b-run', 'reports/code-pages.threads.json', [thread('review-code', [[2, 'fix', 'closed']])]);

  it('reads time from the stages, spend and calls from the calls, and the allowance from the reading before the run', () => {
    const g = readGeneration({ id: 'b-run', dir: path.join(runsDir, 'b-run') }, runsDir);
    expect(g.timeMs).toMatchObject({ total: 92 * 60_000, planning: 30 * 60_000, code: 60 * 60_000 });
    expect(g).toMatchObject({ backend: 'meta', agent: 'Muse Code', calls: 10, tokensIn: 1100, tokensCached: 900, tokensOut: 60, costUsd: 0.5 });
    expect(g.models).toEqual([{ model: 'muse-spark-1.3', calls: 9 }, { model: 'muse-wonder-1.0', calls: 1 }]);
    expect(g.subscription).toEqual({ weekFrom: 24, weekTo: 27 });
    // A unit's rounds are inside its stage's; only pipeline stages count.
    expect(g).toMatchObject({ rounds: 3, known: 2 });
    expect(g.review).toEqual([{ reviewer: 'code', part: 'code', caught: 1, fixed: 0, unchecked: 1, open: 0, threads: 0 }]);
    expect(g.threads).toEqual({ issues: 1, threads: 0 });
  });
});
