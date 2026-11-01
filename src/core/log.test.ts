import { describe, expect, it } from 'vitest';
import { runLog } from './log';
import type { EventInput } from './run';

const PIPELINE = ['flows-scope', 'flows-expand', 'design-draw', 'design-frame'];
const call = { model: 'muse', input: 12_300, cachedInput: 8_000, output: 950, costUsd: 0.0123, durationMs: 41_200 };

function logged(events: EventInput[]): string[] {
  const lines: string[] = [];
  const log = runLog(PIPELINE, (line) => lines.push(line));
  for (const event of events) log.event({ ts: '', ...event });
  return lines;
}

describe('the run log', () => {
  it("puts each part's rounds under its stage, under its group", () => {
    expect(
      logged([
        { type: 'stage:start', stage: 'flows-expand' },
        { type: 'stage:start', stage: 'flows-expand-2' },
        { type: 'round:start', stage: 'flows-expand-2', round: 1, fixing: 0 },
        { type: 'llm:call', stage: 'flows-expand-2', round: 1, ...call },
        { type: 'round:validated', stage: 'flows-expand-2', round: 1, mandatory: 3, warnings: 1, rules: ['FLOW-007', 'FLOW-007', 'FLOW-012'] },
        { type: 'stage:round', stage: 'flows-expand-2', round: 1, mandatory: 3, warnings: 1, blockers: 0 },
        { type: 'round:start', stage: 'flows-expand-2', round: 2, fixing: 3 },
        { type: 'review:start', stage: 'flows-expand-2', round: 2, reviewer: 'peer' },
        { type: 'llm:call', stage: 'flows-expand-2-review-peer', round: 2, reviewer: 'peer', blockers: 1, ...call },
        { type: 'stage:done', stage: 'flows-expand-2', rounds: 3, known: 1 },
        { type: 'stage:done', stage: 'flows-expand' },
      ]),
    ).toEqual([
      'flows',
      '  expand',
      '    expand-2 running',
      '    expand-2 round 1 started',
      '    expand-2 round 1 written (muse, 12.3k in (8.0k cached), 950 out, $0.0123, 41.2s)',
      '    expand-2 round 1 validate found 3 mandatory (FLOW-007 ×2, FLOW-012), 1 warning',
      '    expand-2 round 1 finished: 3 pending (3 mandatory, 0 blockers)',
      '    expand-2 round 2 started, fixing 3 issues',
      '    expand-2 round 2 review peer started',
      '    expand-2 round 2 review peer found 1 blocker (muse, 12.3k in (8.0k cached), 950 out, $0.0123, 41.2s)',
      '    expand-2 done: 3 rounds, 1 known issue',
    ]);
  });

  it('repeats the headers when a line belongs to another stage', () => {
    expect(
      logged([
        { type: 'stage:start', stage: 'design-draw-W03' },
        { type: 'stage:start', stage: 'design-frame-SH1' },
        { type: 'stage:failed', stage: 'design-draw-W03', round: 2, error: 'Error: cut' },
      ]),
    ).toEqual([
      'design',
      '  draw',
      '    draw-W03 running',
      '  frame',
      '    frame-SH1 running',
      '  draw',
      '    draw-W03 failed in round 2: Error: cut',
    ]);
  });

  it('names a retried answer and leaves the time out when the call has none', () => {
    const { durationMs: _, ...paid } = call;
    expect(
      logged([{ type: 'llm:call', stage: 'flows-scope', round: 1, invalid: true, ...paid }]).at(-1),
    ).toBe('    scope round 1 answer did not match the schema (muse, 12.3k in (8.0k cached), 950 out, $0.0123)');
  });
});

describe('a step committed in the app', () => {
  it('names its patch file under its stage', () => {
    const lines: string[] = [];
    const log = runLog(['code-scaffold', 'code-pages'], (line) => lines.push(line));
    log.event({ ts: '', type: 'stage:patch', stage: 'code-pages-S04', file: 'runs/x/patches/003-weave-page-S04.patch' });
    expect(lines).toEqual(['code', '  pages', '    pages-S04 patch runs/x/patches/003-weave-page-S04.patch']);
  });
});
