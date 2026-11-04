import type { RouteReport } from './browser';
import type { CodeReport } from './code';
import type { GenerationReport } from './generation';

// The benchmark as one record per app and as markdown: the run's own table,
// and one table that sets apps side by side.

export const SERVER_NOTE =
  "Measured on the app's dev server (`next dev`), not a production build. Pages are judged whole, design-system components included.";

export type Benchmark = {
  runId: string;
  createdAt: string;
  server: 'next dev';
  generation?: GenerationReport;
  code?: CodeReport;
  routes?: RouteReport[];
};

const pct = (part: number, whole: number) => (whole ? (100 * part) / whole : 100);
const int = (n: number) => Math.round(n).toLocaleString('en-US');
const one = (n: number) => (Math.round(n * 10) / 10).toString();
const minutes = (ms: number) => {
  const m = Math.round(ms / 60_000);
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`;
};
const millions = (n: number) => `${one(n / 1e6)}M`;
const table = (head: string[], rows: string[][]) =>
  [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');

/** The app-wide numbers: sums over routes, and percentages of the sums. */
export function summarize(bench: Benchmark): Record<string, string> {
  const out: Record<string, string> = {};
  const g = bench.generation;
  if (g) {
    out['Backend · agent'] = `${g.backend} · ${g.agent}`;
    out['Models'] = g.models.map((m) => m.model).join(', ');
    out['End-to-end time'] = minutes(g.timeMs.total);
    out['Scope to contract'] = minutes(g.timeMs.planning);
    out['Frames to pages'] = minutes(g.timeMs.code);
    out['Cost'] = `$${g.costUsd.toFixed(2)}`;
    if (g.subscription)
      out['Muse Code weekly allowance'] =
        g.subscription.weekFrom === undefined ? `${g.subscription.weekTo}% after` : `${g.subscription.weekTo - g.subscription.weekFrom}% (${g.subscription.weekFrom}% to ${g.subscription.weekTo}%)`;
    out['Model calls'] = int(g.calls);
    out['Tokens in / out'] = `${millions(g.tokensIn)} / ${millions(g.tokensOut)}`;
    out['Rounds / known issues'] = `${g.rounds} / ${g.known}`;
    // Issues by any agent, the validators included; fixed when a later review or validation looked at the fix.
    out['Issues raised'] = int(g.threads.issues);
    out['Issues fixed'] = int(g.review.reduce((n, r) => n + r.fixed, 0));
    out['AI discussion threads'] = int(g.threads.threads);
  }
  const routes = (bench.routes ?? []).filter((r) => !r.error);
  if (routes.length) {
    const sum = (pick: (r: RouteReport) => number) => routes.reduce((n, r) => n + pick(r), 0);
    const a = (r: RouteReport) => r.a11y!;
    const k = (r: RouteReport) => r.keyboard!;
    out['Routes measured'] = `${routes.length} of ${bench.routes!.length}`;
    out['axe critical + serious'] = int(sum((r) => a(r).axe.critical + a(r).axe.serious));
    out['axe moderate + minor'] = int(sum((r) => a(r).axe.moderate + a(r).axe.minor));
    out['axe rules passed'] = `${one(pct(sum((r) => a(r).rulesPassed), sum((r) => a(r).rulesPassed + a(r).rulesFailed.length)))}%`;
    out['Contrast failures'] = int(sum((r) => a(r).contrastFailures));
    out['Targets under 24 px'] = int(sum((r) => a(r).smallTargets));
    out['Unnamed controls'] = int(sum((r) => a(r).tree.unnamedControls.length));
    out['Routes with one main and one h1'] = `${routes.filter((r) => a(r).tree.mains === 1 && a(r).tree.h1s === 1).length} of ${routes.length}`;
    out['Skipped heading levels'] = int(sum((r) => a(r).tree.skippedLevels));
    out['Keyboard: reachable'] = `${one(pct(sum((r) => k(r).reachable), sum((r) => k(r).interactive)))}% of ${int(sum((r) => k(r).interactive))}`;
    out['Keyboard: focus visible'] = `${one(pct(sum((r) => k(r).focusVisible), sum((r) => k(r).reachable)))}%`;
    out['Keyboard: Enter and Space work'] = `${one(pct(sum((r) => k(r).enterOk + k(r).spaceOk), 2 * sum((r) => k(r).buttons)))}%`;
    out['Keyboard: traps / order inversions'] = `${routes.filter((r) => k(r).trap).length} / ${sum((r) => k(r).inversions)}`;
    out['Keyboard: skip link'] = `${routes.filter((r) => k(r).skipLink).length} of ${routes.length}`;
  }
  const c = bench.code;
  if (c) {
    out['Files / lines'] = `${int(c.files)} / ${int(c.lines)}`;
    out['Type errors'] = int(c.tsc.errors);
    out['ESLint errors / warnings'] = `${c.eslint.errors} / ${c.eslint.warnings}`;
    out['Design-system validate errors / warnings'] = `${c.validate.errors} / ${c.validate.warnings}`;
    out['Duplicated code'] = `${one(c.clones.percentage)}% (${c.clones.count} clones, largest ${c.clones.maxLines} lines)`;
    out['Files over 300 lines'] = int(c.longFiles);
    out['Lines written by the model'] = `${one(pct(c.linesByOrigin.model, c.lines))}%`;
  }
  return out;
}

function routeTables(routes: RouteReport[]): string[] {
  const ok = routes.filter((r) => !r.error);
  const sections = [
    '## Accessibility',
    table(
      ['Route', 'Signed in', 'axe critical + serious', 'axe moderate + minor', 'Rules passed', 'Contrast failures', 'Targets under 24 px', 'Unnamed controls', 'main / h1', 'Skipped levels'],
      ok.map((r) => {
        const a = r.a11y!;
        return [r.route, r.signedIn ? 'yes' : 'no', `${a.axe.critical + a.axe.serious}`, `${a.axe.moderate + a.axe.minor}`, `${a.rulesPassed} of ${a.rulesPassed + a.rulesFailed.length}`, `${a.contrastFailures}`, `${a.smallTargets}`, `${a.tree.unnamedControls.length}`, `${a.tree.mains} / ${a.tree.h1s}`, `${a.tree.skippedLevels}`];
      }),
    ),
    '## Keyboard',
    table(
      ['Route', 'Controls', 'Reachable', 'Focus visible', 'Enter and Space', 'Trap', 'Order inversions', 'Skip link'],
      ok.map((r) => {
        const k = r.keyboard!;
        return [r.route, `${k.interactive}`, `${k.reachable}`, `${k.focusVisible}`, `${k.enterOk + k.spaceOk} of ${2 * k.buttons}`, k.trap ? 'yes' : 'no', `${k.inversions}`, k.skipLink ? 'yes' : 'no'];
      }),
    ),
  ];
  const failed = routes.filter((r) => r.error);
  if (failed.length) sections.push('## Routes that could not be measured', ...failed.map((r) => `- ${r.route}: ${r.error}`));
  return sections;
}

/** `05-benchmark.md`: the summary, what the checks and review agents caught, then a table per measurement. */
export function renderBenchmark(bench: Benchmark): string {
  const summary = summarize(bench);
  const review = bench.generation?.review ?? [];
  return [
    `# Benchmark of ${bench.runId}`,
    `${bench.createdAt}. ${SERVER_NOTE}`,
    '## Summary',
    table(['', ''], Object.entries(summary)),
    '## Issues the checks and review agents caught',
    'Each issue is a thread between the agent that raised it and the fix session. Fixed: a fix session closed it and a later review or validation looked at that round. Fixed, unchecked: closed in the final round, which nobody reviews. Discussion threads: issues a reply kept open, from the fix session or the reviewer. `checks` are the validators, not a review agent.',
    table(['Part', 'Reviewer', 'Caught', 'Fixed', 'Fixed, unchecked', 'Open', 'Discussion threads'], review.map((r) => [r.part, r.reviewer, `${r.caught}`, `${r.fixed}`, `${r.unchecked}`, `${r.open}`, `${r.threads}`])),
    ...(bench.routes ? routeTables(bench.routes) : []),
  ].join('\n\n') + '\n';
}

/** One row per number, one column per app, from each run's `benchmark.json`. */
export function renderComparison(benches: Benchmark[]): string {
  const summaries = benches.map(summarize);
  const keys = [...new Set(summaries.flatMap((s) => Object.keys(s)))];
  return [
    '# Benchmark comparison',
    SERVER_NOTE,
    table(['', ...benches.map((b) => b.runId)], keys.map((key) => [key, ...summaries.map((s) => s[key] ?? '-')])),
  ].join('\n\n') + '\n';
}
