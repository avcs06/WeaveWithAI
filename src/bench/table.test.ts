import { describe, expect, it } from 'vitest';
import type { GenerationReport } from './generation';
import type { Benchmark } from './report';
import { renderRunTable, runTable, TABLE_NOTE } from './table';

const generation: GenerationReport = {
  backend: 'meta',
  agent: 'Muse Code',
  models: [{ model: 'muse-spark-1.3', calls: 300 }, { model: 'muse-wonder-1.0', calls: 3 }],
  timeMs: { total: 100 * 60_000, planning: 37 * 60_000, code: 61 * 60_000, stages: [] },
  calls: 303,
  tokensIn: 1,
  tokensCached: 0,
  tokensOut: 1,
  costUsd: 6.6227,
  subscription: { weekFrom: 28, weekTo: 33 },
  rounds: 31,
  known: 12,
  review: [
    { reviewer: 'ux', part: 'code', caught: 10, fixed: 9, unchecked: 1, open: 0, threads: 0 },
    { reviewer: 'checks', part: 'planning', caught: 1, fixed: 1, unchecked: 0, open: 0, threads: 1 },
  ],
  threads: { issues: 11, threads: 1 },
};

describe('the run table', () => {
  it('says how the app was made, its spend in money and in the subscription, and the issues', () => {
    const rows = Object.fromEntries(runTable({ runId: 'r', createdAt: '', server: 'next dev', generation }));
    expect(rows).toMatchObject({
      Model: 'muse-spark-1.3, muse-wonder-1.0 on the Meta Model API',
      'Coding agent': 'Muse Code',
      'End-to-end time': '1 h 40 min (scope to contract 37 min, frames to pages 1 h 1 min)',
      'Total cost': '$6.62 for the model calls; the coding sessions ran on the Muse Code subscription',
      'Muse Code subscription': '5% of the weekly allowance (28% to 33%)',
      'Issues raised': '11',
      'Issues fixed': '10',
      'AI discussion threads': '1',
    });
  });

  it('leaves out the subscription on a key, and the dev-server note when nothing was opened in a browser', () => {
    const bench: Benchmark = { runId: 'r', createdAt: '', server: 'next dev', generation: { ...generation, backend: 'baseten', agent: 'OpenCode', subscription: undefined } };
    const markdown = renderRunTable(bench);
    expect(markdown).toContain('| Total cost | $6.62 |');
    expect(markdown).not.toContain('Muse Code subscription');
    expect(markdown).not.toContain(TABLE_NOTE);
  });
});
