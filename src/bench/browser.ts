import type { Browser } from 'playwright-core';
import { builtScreens, pageSample, pagesSpec } from '../agents/04code/04pages/stage';
import type { Scope } from '../agents/01flows/01scope/schema';
import type { Flows } from '../agents/01flows/schema';
import type { Architecture } from '../agents/02design/02architect/schema';
import type { Contract } from '../agents/03contract/schema';
import { openRoute, withBrowser } from '../checks/browser';
import { axeCheck, contrastCheck, targetSizes } from '../checks/collectors';
import type { RouteSample } from '../checks/index';
import { keyboardWalk } from '../checks/keyboard';
import { readArtifact } from '../core/artifacts';
import { type Run, runPath } from '../core/run';
import { withDevServer } from '../engine/server';
import { readTree, type TreeReport } from './aria';
import { measureLoad, type PerfReport } from './perf';

// Every screen the pages session built, opened on the app's dev server the way
// the coding gate opens it, signed in where the screen needs it: accessibility,
// what a screen reader gets, the keyboard walk, and load numbers. The page is
// judged whole, design-system components included, as a user meets it.

export type RouteReport = {
  route: string;
  screen: string;
  signedIn: boolean;
  error?: string;
  a11y?: {
    /** Elements failing an axe rule, by the rule's impact. */
    axe: { critical: number; serious: number; moderate: number; minor: number };
    rulesFailed: string[];
    rulesPassed: number;
    contrastFailures: number;
    worstContrast: number | null;
    smallTargets: number;
    tree: TreeReport;
  };
  keyboard?: { interactive: number; reachable: number; focusVisible: number; inversions: number; trap: boolean; buttons: number; enterOk: number; spaceOk: number; skipLink: boolean };
  perf?: PerfReport;
};

/** The screens of the run's pages stage, as its gate samples them. */
export function benchRoutes(run: Run): RouteSample[] {
  const scope = readArtifact<Scope>(run, 'flows-scope').data;
  const flows = readArtifact<Flows>(run, 'flows-expand').data;
  const architecture = readArtifact<Architecture>(run, 'design-architect').data;
  const contract = readArtifact<Contract>(run, 'contract').data;
  const routes = pagesSpec(architecture, contract, flows, scope).routes ?? [];
  return builtScreens(architecture).map((screen, i) => pageSample(run, screen, routes[i]!));
}

async function measureRoute(browser: Browser, sample: RouteSample): Promise<RouteReport> {
  const base = { route: sample.route, screen: sample.screen, signedIn: Boolean(sample.storage) };
  const context = await browser.newContext();
  try {
    const page = await openRoute(context, sample.url, sample.storage);
    const { violations, passes } = await axeCheck(page, { whole: true });
    const contrast = await contrastCheck(page);
    const targets = await targetSizes(page);
    const tree = readTree(await page.locator('body').ariaSnapshot());
    await page.close();
    // The walk blocks every request that would change data, so it gets a page of its own.
    const walk = await keyboardWalk(await openRoute(context, sample.url, sample.storage), { blockMutations: true, whole: true });
    const axe = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    for (const v of violations) if (v.impact && v.impact in axe) axe[v.impact as keyof typeof axe] += v.nodes.length;
    return {
      ...base,
      a11y: {
        axe,
        rulesFailed: violations.map((v) => v.id),
        rulesPassed: passes,
        contrastFailures: contrast.failures.length,
        worstContrast: contrast.failures.length ? Math.min(...contrast.failures.map((f) => f.ratio)) : null,
        smallTargets: targets.findings.length,
        tree,
      },
      keyboard: {
        interactive: walk.interactive,
        reachable: walk.reachable,
        focusVisible: walk.focusVisible,
        inversions: walk.inversions,
        trap: walk.trap,
        buttons: walk.activation.buttons,
        enterOk: walk.activation.enterOk,
        spaceOk: walk.activation.spaceOk,
        skipLink: walk.skipLink,
      },
      perf: await measureLoad(browser, sample),
    };
  } catch (error) {
    return { ...base, error: String(error).split('\n')[0] };
  } finally {
    await context.close();
  }
}

/** Starts the app's dev server unless one serves it already, and measures each route in turn. */
export async function runBrowser(run: Run, onRoute: (report: RouteReport) => void = () => {}): Promise<RouteReport[]> {
  const routes = benchRoutes(run);
  return withDevServer(runPath(run, 'app'), () =>
    withBrowser(async (browser) => {
      const reports: RouteReport[] = [];
      for (const sample of routes) {
        const report = await measureRoute(browser, sample);
        onRoute(report);
        reports.push(report);
      }
      return reports;
    }),
    routes[0]?.url,
  );
}
