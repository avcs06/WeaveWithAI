import type { Benchmark } from './report';

// The short table a run ends with and the examples' READMEs carry: how the
// app was made, then the numbers a reader compares apps on.

const BACKENDS: Record<string, string> = { meta: 'the Meta Model API', baseten: 'Baseten', modal: 'Modal' };
export const TABLE_NOTE =
  "Accessibility and keyboard numbers are from the app's dev server (`next dev`), not a production build.";

const int = (n: number) => Math.round(n).toLocaleString('en-US');
const one = (n: number) => (Math.round(n * 10) / 10).toString();
const minutes = (ms: number) => {
  const m = Math.round(ms / 60_000);
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`;
};

/** Lines under a label that needs saying what it counts, each about as long as the label. */
const BRIEFS: Record<string, string[]> = { 'AI discussion threads': ['Issues an agent kept', 'open to discuss'] };

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
    rows.push(
      ['Screens measured', `${routes.length}`],
      ['Accessibility violations (axe, WCAG 2.2 AA)', int(sum((r) => Object.values(r.a11y!.axe).reduce((a, b) => a + b, 0)))],
      ['Contrast failures', int(sum((r) => r.a11y!.contrastFailures))],
      ['Controls without a name', int(sum((r) => r.a11y!.tree.unnamedControls.length))],
      ['Keyboard: controls reachable with Tab', `${one(interactive ? (100 * reachable) / interactive : 100)}% of ${int(interactive)}`],
      ['Keyboard: focus visible', `${one(reachable ? (100 * sum((r) => r.keyboard!.focusVisible)) / reachable : 100)}%`],
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

/** The table for a terminal: labels padded into one column, values beside them, the dev-server note under them. */
export function renderTerminalTable(bench: Benchmark): string {
  const rows = runTable(bench);
  const width = Math.max(...rows.map(([label]) => label.length));
  const lines = rows.flatMap(([label, value]) => [`  ${label.padEnd(width)}  ${value}`, ...(BRIEFS[label] ?? []).map((line) => `    ${line}`)]);
  return [`Benchmark of ${bench.runId}`, ...lines, ...(bench.routes?.length ? ['', TABLE_NOTE.replaceAll('`', '')] : [])].join('\n');
}

/** The table as markdown, with the dev-server note under it when it has browser numbers. */
export function renderRunTable(bench: Benchmark): string {
  const rows = runTable(bench);
  const cell = (label: string) => (BRIEFS[label] ? `${label}<br><sub>${BRIEFS[label]!.join('<br>')}</sub>` : label);
  const table = ['| | |', '|---|---|', ...rows.map(([label, value]) => `| ${cell(label)} | ${value} |`)].join('\n');
  return bench.routes?.length ? `${table}\n\n${TABLE_NOTE}` : table;
}
