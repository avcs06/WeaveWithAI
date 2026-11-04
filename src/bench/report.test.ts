import { describe, expect, it } from 'vitest';
import type { RouteReport } from './browser';
import { medianReport } from './perf';
import { type Benchmark, renderBenchmark, renderComparison, SERVER_NOTE, summarize } from './report';

const route = (path: string, over: Partial<RouteReport> = {}): RouteReport => ({
  route: path,
  screen: 'S01',
  signedIn: true,
  a11y: {
    axe: { critical: 0, serious: 1, moderate: 2, minor: 0 },
    rulesFailed: ['color-contrast'],
    rulesPassed: 19,
    contrastFailures: 1,
    worstContrast: 3.1,
    smallTargets: 0,
    tree: { nodes: 30, unnamedControls: [], mains: 1, h1s: 1, skippedLevels: 0 },
  },
  keyboard: { interactive: 10, reachable: 10, focusVisible: 9, inversions: 0, trap: false, buttons: 2, enterOk: 2, spaceOk: 1, skipLink: false },
  perf: { fcpMs: 600, lcpMs: 700, cls: 0, tbtMs: 200, domNodes: 140, jsKb: 5000, loadMs: 600 },
  ...over,
});

const bench: Benchmark = {
  runId: 'r1',
  createdAt: '2026-11-04T10:00:00.000Z',
  server: 'next dev',
  routes: [route('/'), route('/books', { perf: { fcpMs: 800, lcpMs: 900, cls: 0.02, tbtMs: 300, domNodes: 200, jsKb: 6000, loadMs: 800 } }), { route: '/broken', screen: 'S03', signedIn: false, error: 'Timeout' }],
};

describe('the benchmark report', () => {
  it('sums the routes it measured and gives percentages of the sums', () => {
    const summary = summarize(bench);
    expect(summary['Routes measured']).toBe('2 of 3');
    expect(summary['axe critical + serious']).toBe('2');
    expect(summary['axe rules passed']).toBe('95%');
    expect(summary['Keyboard: reachable']).toBe('100% of 20');
    expect(summary['Keyboard: focus visible']).toBe('90%');
    expect(summary['Keyboard: Enter and Space work']).toBe('75%');
    expect(summary['Load, median route (dev): FCP / LCP']).toBe('700 / 800 ms');
  });

  it('says it was measured on the dev server, and lists a route it could not measure', () => {
    const markdown = renderBenchmark(bench);
    expect(markdown).toContain(SERVER_NOTE);
    expect(markdown).toContain('not a production build');
    expect(markdown).toContain('- /broken: Timeout');
  });

  it('sets apps side by side, a number one app lacks shown as a dash', () => {
    const markdown = renderComparison([bench, { runId: 'r2', createdAt: '', server: 'next dev' }]);
    expect(markdown).toContain('|  | r1 | r2 |');
    expect(markdown).toContain('| Routes measured | 2 of 3 | - |');
  });
});

describe('medianReport', () => {
  it('takes the median of each number, and null only when no load measured it', () => {
    const load = (fcpMs: number | null, tbtMs: number) => ({ fcpMs, lcpMs: null, cls: 0, tbtMs, domNodes: 1, jsKb: 1, loadMs: 1 });
    expect(medianReport([load(100, 30), load(null, 10), load(300, 20)])).toMatchObject({ fcpMs: 200, lcpMs: null, tbtMs: 20 });
  });
});
