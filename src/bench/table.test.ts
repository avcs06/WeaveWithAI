import { describe, expect, it } from 'vitest';
import type { GenerationReport } from './generation';
import type { Benchmark } from './report';
import { renderTerminalTable, runTable, TABLE_NOTE } from './table';

const generation: GenerationReport = {
  models: [{ model: 'claude-sonnet-5-5', calls: 300 }, { model: 'claude-opus-5-5', calls: 3 }],
  timeMs: { total: 100 * 60_000, planning: 37 * 60_000, code: 61 * 60_000, stages: [] },
  calls: 303,
  tokensIn: 1,
  tokensCached: 0,
  tokensOut: 1,
  costUsd: 6.6227,
  subscription: true,
  rounds: 31,
  known: 12,
  review: [
    { reviewer: 'ux', part: 'code', caught: 10, fixed: 9, unchecked: 1, open: 0, threads: 0 },
    { reviewer: 'checks', part: 'planning', caught: 1, fixed: 1, unchecked: 0, open: 0, threads: 1 },
  ],
  threads: { issues: 11, threads: 1 },
};

describe('the run table', () => {
  it('says how the app was made, its spend in money and on the subscription, and the issues', () => {
    const rows = Object.fromEntries(runTable({ runId: 'r', createdAt: '', server: 'next dev', generation }));
    expect(rows).toMatchObject({
      Model: 'claude-sonnet-5-5, claude-opus-5-5',
      'End-to-end time': '1 h 40 min (scope to contract 37 min, frames to pages 1 h 1 min)',
      'Total cost': '$6.62 for the model calls; the coding sessions ran on a Claude subscription',
      'Issues raised': '11',
      'Issues fixed': '10',
      'AI discussion threads': '1',
    });
  });

  it('leaves out the subscription on a key, and the dev-server note when nothing was opened in a browser', () => {
    const bench: Benchmark = { runId: 'r', createdAt: '', server: 'next dev', generation: { ...generation, subscription: false } };
    const table = renderTerminalTable(bench);
    expect(Object.fromEntries(runTable(bench))['Total cost']).toBe('$6.62');
    expect(table).not.toContain('subscription');
    expect(table).not.toContain(TABLE_NOTE.replaceAll('`', ''));
  });

  it('lines the values up in one column for a terminal', () => {
    const lines = renderTerminalTable({ runId: 'r1', createdAt: '', server: 'next dev', generation }).split('\n');
    expect(lines[0]).toBe('Benchmark of r1');
    // Brief lines under a label sit indented in the label column and carry no value.
    const starts = lines.slice(1).filter((line) => !line.startsWith('    ')).map((line) => line.search(/\S/) + line.trimStart().search(/ {2}\S/) + 2);
    expect(new Set(starts).size).toBe(1);
    expect(lines).toContain(`  ${'Model'.padEnd('AI discussion threads'.length)}  claude-sonnet-5-5, claude-opus-5-5`);
  });

  it('says under AI discussion threads what they count, in two short lines', () => {
    const bench: Benchmark = { runId: 'r1', createdAt: '', server: 'next dev', generation };
    expect(renderTerminalTable(bench).split('\n')).toEqual(expect.arrayContaining(['    Issues an agent kept', '    open to discuss']));
  });
});
