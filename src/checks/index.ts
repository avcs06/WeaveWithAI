import type { Issue } from '../core/issues';
import { type Run, runPath } from '../core/run';
import { writeJsonAtomic } from '../core/utils';
import { openRoute, withBrowser } from './browser';
import {
  axeCheck,
  colorVariables,
  contrastCheck,
  firstViewport,
  overflowCheck,
  proximity,
  targetSizes,
  typography,
} from './collectors';
import { type KeyboardReport, keyboardWalk } from './keyboard';
import { type Finding, finding } from './types';

// The rendered checks over every sampled route: the gate after a coding
// session and the app MCP fail on the mandatory findings, and the benchmark
// reports all of them, from the same collectors.

export type RouteSample = {
  route: string;
  url: string;
  screen: string;
  entry: boolean;
  /** `data-testid`s of the page's primary actions. */
  primaryTestIds: string[];
  /** `data-testid`s of controls that open a dialog. */
  dialogTriggers?: string[];
  /** localStorage entries written before the route loads: a member's session on a page behind sign-in. */
  storage?: Record<string, string>;
};

export type RenderedReport = {
  route: string;
  findings: Finding[];
  metrics: {
    axeViolations: number;
    contrastFailures: number;
    contrastUnknown: number;
    small24: number;
    keyboard: Omit<KeyboardReport, 'findings'>;
  };
};

/** A walk that could not finish: nothing it counted stands. */
const EMPTY_WALK: Omit<KeyboardReport, 'findings'> = {
  interactive: 0,
  reachable: 0,
  focusVisible: 0,
  inversions: 0,
  trap: false,
  dialogs: { opened: 0, escaped: 0, focusReturned: 0 },
  activation: { buttons: 0, enterOk: 0, spaceOk: 0 },
  skipLink: false,
};

/** The theme's colors as hex, and the accent ones among them. */
export type ThemeColors = { all: Set<string>; accent: Set<string> };

export async function checkRoute(
  sample: RouteSample,
  theme: ThemeColors,
  open: (url: string) => Promise<import('playwright-core').Page>,
): Promise<RenderedReport> {
  const page = await open(sample.url);
  // A check that breaks is the checker's trouble, not the page's: a warning on its rule, and the other checks go on.
  const broken: Finding[] = [];
  const guard = async <T>(rule: string, fallback: T, check: () => Promise<T>): Promise<T> => {
    try {
      return await check();
    } catch (error) {
      broken.push(finding(rule, 'warning', `the check could not finish: ${String(error).split('\n')[0]}`));
      return fallback;
    }
  };
  try {
    const axe = await guard('DESIGN-R-001', { findings: [], violations: [] }, () => axeCheck(page));
    const contrast = await guard('DESIGN-R-002', { findings: [], failures: [], unknown: 0 }, () => contrastCheck(page));
    const targets = await guard('DESIGN-R-004', { findings: [], small24: 0 }, () => targetSizes(page));
    const rest = [
      ...(await guard('DESIGN-R-005', [], () => overflowCheck(page))),
      ...(sample.entry ? await guard('DESIGN-R-006', [], () => firstViewport(page, sample.primaryTestIds)) : []),
      ...(await guard('DESIGN-R-007', [], () => typography(page))),
      ...(await guard('DESIGN-R-008', [], () => colorVariables(page, theme))),
      ...(await guard('DESIGN-R-009', [], () => proximity(page))),
    ];
    // Last: the walk presses keys and may open and close things.
    const { findings: walked, ...keyboard } = await guard('DESIGN-R-003', { ...EMPTY_WALK, findings: [] }, () =>
      keyboardWalk(page, { blockMutations: true, dialogTriggers: sample.dialogTriggers ?? [] }),
    );
    return {
      route: sample.route,
      findings: [
        ...axe.findings,
        ...contrast.findings,
        ...targets.findings,
        ...rest,
        ...walked,
        ...broken,
      ],
      metrics: {
        axeViolations: axe.violations.length,
        contrastFailures: contrast.failures.length,
        contrastUnknown: contrast.unknown,
        small24: targets.small24,
        keyboard,
      },
    };
  } finally {
    await page.close();
  }
}

/** Every route; writes `reports/rendered.json` and returns the findings as issues. */
export async function runRenderedChecks(opts: {
  run: Run;
  routes: RouteSample[];
  theme: ThemeColors;
}): Promise<{ issues: Issue[]; perRoute: RenderedReport[] }> {
  const perRoute = await withBrowser(async (browser) => {
    const context = await browser.newContext();
    const reports: RenderedReport[] = [];
    for (const sample of opts.routes)
      reports.push(
        await checkRoute(sample, opts.theme, (url) => openRoute(context, url, sample.storage)),
      );
    await context.close();
    return reports;
  });
  writeJsonAtomic(runPath(opts.run, 'reports', 'rendered.json'), perRoute);
  const issues = perRoute.flatMap((report) =>
    report.findings.map((f): Issue => ({
      rule: f.rule,
      severity: f.severity,
      message: `${report.route}: ${f.message}`,
      ...(f.element !== undefined && { at: f.element }),
    })),
  );
  return { issues, perRoute };
}
