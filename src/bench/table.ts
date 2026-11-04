import type { Benchmark } from './report';
import { median } from './perf';

// The short table a run ends with and the examples' READMEs carry: how the
// app was made, then the numbers a reader compares apps on.

const BACKENDS: Record<string, string> = { meta: 'the Meta Model API', baseten: 'Baseten', modal: 'Modal' };
export const TABLE_NOTE =
  "Accessibility, keyboard and load numbers are from the app's dev server (`next dev`), not a production build. Load would be faster in production; the other numbers would not change.";

const int = (n: number) => Math.round(n).toLocaleString('en-US');
const one = (n: number) => (Math.round(n * 10) / 10).toString();
const minutes = (ms: number) => {
  const m = Math.round(ms / 60_000);
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`;
};

/** Label and value per row; a part the benchmark lacks leaves its rows out. */
export function runTable(bench: Benchmark): [string, string][] {
  const rows: [string, string][] = [];
  const g = bench.generation;
  if (g) {
    rows.push(
      ['Model', `${g.models.map((m) => m.model).join(', ')} on ${BACKENDS[g.backend] ?? g.backend}`],
      ['Coding agent', g.agent],
      ['End-to-end time', `${minutes(g.timeMs.total)} (scope to contract ${minutes(g.timeMs.planning)}, frames to pages ${minutes(g.timeMs.code)})`],
      ['Total cost', `$${g.costUsd.toFixed(2)}${g.subscription ? ' for the model calls; the coding sessions ran on the Muse Code subscription' : ''}`],
    );
    const { weekFrom, weekTo } = g.subscription ?? {};
    if (weekTo !== undefined)
      rows.push(['Muse Code subscription', weekFrom === undefined ? `${weekTo}% of the weekly allowance after the run` : `${weekTo - weekFrom}% of the weekly allowance (${weekFrom}% to ${weekTo}%)`]);
    rows.push(
      ['Issues raised', int(g.threads.issues)],
      ['Issues fixed', int(g.review.reduce((n, r) => n + r.fixed, 0))],
      ['AI discussion threads', int(g.threads.threads)],
    );
  }
  const routes = (bench.routes ?? []).filter((r) => !r.error);
  if (routes.length) {
    const sum = (pick: (r: (typeof routes)[number]) => number) => routes.reduce((n, r) => n + pick(r), 0);
    const interactive = sum((r) => r.keyboard!.interactive);
    const reachable = sum((r) => r.keyboard!.reachable);
    const load = (pick: (r: (typeof routes)[number]) => number | null) => median(routes.map(pick).filter((v): v is number => v !== null));
    rows.push(
      ['Screens measured', `${routes.length}`],
      ['Accessibility violations (axe, WCAG 2.2 AA)', int(sum((r) => Object.values(r.a11y!.axe).reduce((a, b) => a + b, 0)))],
      ['Contrast failures', int(sum((r) => r.a11y!.contrastFailures))],
      ['Controls without a name', int(sum((r) => r.a11y!.tree.unnamedControls.length))],
      ['Keyboard: controls reachable with Tab', `${one(interactive ? (100 * reachable) / interactive : 100)}% of ${int(interactive)}`],
      ['Keyboard: focus visible', `${one(reachable ? (100 * sum((r) => r.keyboard!.focusVisible)) / reachable : 100)}%`],
      ['Page load, median screen (dev server)', `FCP ${int(load((r) => r.perf!.fcpMs))} ms, LCP ${int(load((r) => r.perf!.lcpMs))} ms`],
    );
  }
  const c = bench.code;
  if (c)
    rows.push(
      ['Type and lint errors', int(c.tsc.errors + c.eslint.errors)],
      ['Design-system validation errors', int(c.validate.errors)],
      ['Duplicated code', `${one(c.clones.percentage)}%`],
      ['Code size', `${int(c.files)} files, ${int(c.lines)} lines`],
    );
  return rows;
}

/** The table as markdown, with the dev-server note under it when it has browser numbers. */
export function renderRunTable(bench: Benchmark): string {
  const rows = runTable(bench);
  const table = ['| | |', '|---|---|', ...rows.map(([label, value]) => `| ${label} | ${value} |`)].join('\n');
  return bench.routes?.length ? `${table}\n\n${TABLE_NOTE}` : table;
}
