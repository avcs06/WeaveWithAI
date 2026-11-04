import type { Browser } from 'playwright-core';
import { HEIGHT, WIDTH } from '../checks/browser';
import type { RouteSample } from '../checks/index';

// Load numbers from the browser's own performance entries. On `next dev`
// they are slower and bigger than a production build: they compare apps and
// runs with each other, never against a budget.

export type PerfReport = { fcpMs: number | null; lcpMs: number | null; cls: number; tbtMs: number; domNodes: number; jsKb: number; loadMs: number };

/** Runs before the page's own scripts, so the observers see every entry from the start. */
const OBSERVE = `
  window.__bench = { lcp: null, cls: 0, longTasks: [] };
  const watch = (type, fn) => { try { new PerformanceObserver((list) => list.getEntries().forEach(fn)).observe({ type, buffered: true }); } catch {} };
  watch('largest-contentful-paint', (e) => { window.__bench.lcp = e.startTime; });
  watch('layout-shift', (e) => { if (!e.hadRecentInput) window.__bench.cls += e.value; });
  watch('longtask', (e) => { window.__bench.longTasks.push(e.duration); });
`;

const READ = `(() => {
  const nav = performance.getEntriesByType('navigation')[0];
  const fcp = performance.getEntriesByName('first-contentful-paint')[0];
  const scripts = performance.getEntriesByType('resource').filter((r) => r.initiatorType === 'script');
  return {
    fcpMs: fcp ? fcp.startTime : null,
    lcpMs: window.__bench.lcp,
    cls: window.__bench.cls,
    // Total blocking time: what each long task holds the main thread past 50 ms.
    tbtMs: window.__bench.longTasks.reduce((sum, d) => sum + Math.max(0, d - 50), 0),
    domNodes: document.getElementsByTagName('*').length,
    jsKb: scripts.reduce((sum, r) => sum + (r.transferSize || r.encodedBodySize), 0) / 1024,
    loadMs: nav ? nav.loadEventEnd : 0,
  };
})()`;

export const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
};

/** Each number's median over `loads`; a number a load could not measure stays null only when no load measured it. */
export function medianReport(loads: PerfReport[]): PerfReport {
  const of = (pick: (load: PerfReport) => number | null) => {
    const values = loads.map(pick).filter((v): v is number => v !== null);
    return values.length ? median(values) : null;
  };
  return {
    fcpMs: of((l) => l.fcpMs),
    lcpMs: of((l) => l.lcpMs),
    cls: of((l) => l.cls) ?? 0,
    tbtMs: of((l) => l.tbtMs) ?? 0,
    domNodes: of((l) => l.domNodes) ?? 0,
    jsKb: of((l) => l.jsKb) ?? 0,
    loadMs: of((l) => l.loadMs) ?? 0,
  };
}

/** One load the dev server compiles for, then the median of `loads` loads, each in a fresh context with an empty cache. */
export async function measureLoad(browser: Browser, sample: RouteSample, loads = 3): Promise<PerfReport> {
  const once = async (): Promise<PerfReport> => {
    const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } });
    try {
      const page = await context.newPage();
      await page.addInitScript((entries) => {
        for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
      }, sample.storage ?? {});
      await page.addInitScript(OBSERVE);
      await page.goto(sample.url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      return (await page.evaluate(READ)) as PerfReport;
    } finally {
      await context.close();
    }
  };
  await once();
  const measured: PerfReport[] = [];
  for (let i = 0; i < loads; i += 1) measured.push(await once());
  return medianReport(measured);
}
