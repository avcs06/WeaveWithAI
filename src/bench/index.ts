import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { appendEvent, type Run, runPath } from '../core/run';
import { writeJsonAtomic } from '../core/utils';
import { type RouteReport, runBrowser } from './browser';
import { runCodeQuality } from './code';
import { readGeneration } from './generation';
import { type Benchmark, renderBenchmark, renderComparison } from './report';

// `weave bench`: measures a run's app and writes `benchmark.json` and
// `05-benchmark.md` beside its other artifacts. No model calls.

export const PARTS = ['generation', 'code', 'browser'] as const;
export type Part = (typeof PARTS)[number];

export async function runBenchmark(run: Run, runsDir: string, opts: { skip?: Part[]; out?: (line: string) => void } = {}): Promise<Benchmark> {
  const out = opts.out ?? console.log;
  const skip = new Set(opts.skip ?? []);
  // A skipped part keeps what the run's last benchmark measured, so refreshing one part loses no other.
  const file = runPath(run, 'benchmark.json');
  const previous: Partial<Benchmark> = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  const bench: Benchmark = { runId: run.id, createdAt: new Date().toISOString(), server: 'next dev' };
  appendEvent(run, { type: 'bench:start', skip: [...skip] });
  // Each part on its own: one that fails is left out of the report, and the others still run.
  const step = async <T>(part: Part, fn: () => Promise<T> | T): Promise<T | undefined> => {
    const started = Date.now();
    try {
      const result = await fn();
      appendEvent(run, { type: 'bench:part', part, ok: true, durationMs: Date.now() - started });
      return result;
    } catch (error) {
      out(`${part} failed: ${String(error).split('\n')[0]}`);
      appendEvent(run, { type: 'bench:part', part, ok: false, durationMs: Date.now() - started, error: String(error) });
      return undefined;
    }
  };
  bench.generation = skip.has('generation') ? previous.generation : await step('generation', () => readGeneration(run, runsDir));
  bench.code = skip.has('code') ? previous.code : await step('code', () => runCodeQuality(run));
  bench.routes = skip.has('browser')
    ? previous.routes
    : await step('browser', () => runBrowser(run, (r: RouteReport) => out(`  ${r.route}${r.error ? `: ${r.error}` : ''}`)));
  writeJsonAtomic(file, bench);
  writeFileSync(runPath(run, '05-benchmark.md'), renderBenchmark(bench));
  appendEvent(run, { type: 'bench:end' });
  return bench;
}

/** Sets the latest benchmark of each run side by side, in `<runsDir>/benchmark-comparison.md`. */
export function compareBenchmarks(runs: Run[], runsDir: string): string {
  const benches = runs.map((run) => JSON.parse(readFileSync(runPath(run, 'benchmark.json'), 'utf8')) as Benchmark);
  const markdown = renderComparison(benches);
  writeFileSync(path.join(runsDir, 'benchmark-comparison.md'), markdown);
  return markdown;
}
