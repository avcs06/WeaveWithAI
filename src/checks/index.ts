import { mkdirSync } from 'node:fs';
import path from 'node:path';
import type { Issue } from '../core/issues';
import type { ImageInput } from '../core/llm';
import { type Run, runPath } from '../core/run';
import { writeJsonAtomic } from '../core/utils';
import { fullScreenshot, openRoute, withBrowser } from './browser';
import {
  axeCheck,
  colorVariables,
  containerSpacing,
  contrastCheck,
  firstViewport,
  numerals,
  overflowCheck,
  targetGaps,
  targetSizes,
  typography,
} from './collectors';
import { type KeyboardReport, keyboardWalk } from './keyboard';
import { contentEdge, frameParts, gridOrphans, type PageTitle, pageTitle, spreadPairs, titleStyles } from './layout';
import { type Finding, finding } from './types';

// The rendered checks over every sampled route: the gate after a coding
// session and the app MCP fail on the mandatory findings, and the benchmark
// reports all of them, from the same collectors.

export type RouteSample = {
  route: string;
  url: string;
  screen: string;
  entry: boolean;
  /** localStorage entries written before the route loads: a member's session on a page behind sign-in. */
  storage?: Record<string, string>;
};

export type RenderedReport = {
  route: string;
  findings: Finding[];
  /** The route's full-height screenshot, when the checks took one. */
  shot?: string;
  /** The page's H1, for DESIGN-R-013's comparison across routes. */
  title: PageTitle | null;
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
  activation: { buttons: 0, enterOk: 0, spaceOk: 0 },
  skipLink: false,
};

/** The theme's colors as hex, and the accent ones among them. */
export type ThemeColors = { all: Set<string>; accent: Set<string> };

export async function checkRoute(
  sample: RouteSample,
  theme: ThemeColors,
  open: (url: string) => Promise<import('playwright-core').Page>,
  shot?: string,
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
    // First, as the page loaded: the checks after it press keys and may open things.
    const shotTaken = shot ? await guard('DESIGN-R-000', false, async () => (await fullScreenshot(page, shot), true)) : false;
    const axe = await guard('DESIGN-R-001', { findings: [], violations: [] }, () => axeCheck(page));
    const contrast = await guard('DESIGN-R-002', { findings: [], failures: [], unknown: 0 }, () => contrastCheck(page));
    const targets = await guard('DESIGN-R-004', { findings: [], small24: 0 }, () => targetSizes(page));
    const rest = [
      ...(await guard('DESIGN-R-005', [], () => overflowCheck(page))),
      ...(sample.entry ? await guard('DESIGN-R-006', [], () => firstViewport(page)) : []),
      ...(await guard('DESIGN-R-007', [], () => typography(page))),
      ...(await guard('DESIGN-R-008', [], () => colorVariables(page, theme))),
      ...(await guard('DESIGN-R-009', [], () => targetGaps(page))),
      ...(await guard('DESIGN-R-010', [], () => containerSpacing(page))),
      ...(await guard('DESIGN-R-012', [], () => numerals(page))),
      ...(await guard('DESIGN-R-014', [], () => contentEdge(page))),
      ...(await guard('DESIGN-R-015', [], () => spreadPairs(page))),
      ...(await guard('DESIGN-R-016', [], () => gridOrphans(page))),
      ...(await guard('DESIGN-R-017', [], () => frameParts(page))),
    ];
    const title = await guard('DESIGN-R-013', null, () => pageTitle(page));
    // Last: the walk presses keys and may open and close things.
    const { findings: walked, ...keyboard } = await guard('DESIGN-R-003', { ...EMPTY_WALK, findings: [] }, () =>
      keyboardWalk(page, { blockMutations: true }),
    );
    return {
      route: sample.route,
      findings: [...axe.findings, ...contrast.findings, ...targets.findings, ...rest, ...walked, ...broken],
      ...(shotTaken && { shot }),
      title,
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

/** Every route; writes `reports/rendered.json` and returns the findings as issues, and with `shotsDir` a screenshot of each route. */
export async function runRenderedChecks(opts: {
  run: Run;
  routes: RouteSample[];
  theme: ThemeColors;
  shotsDir?: string;
}): Promise<{ issues: Issue[]; perRoute: RenderedReport[]; shots: ImageInput[] }> {
  if (opts.shotsDir) mkdirSync(opts.shotsDir, { recursive: true });
  const perRoute = await withBrowser(async (browser) => {
    const context = await browser.newContext();
    const reports: RenderedReport[] = [];
    for (const [i, sample] of opts.routes.entries()) {
      const shot = opts.shotsDir && path.join(opts.shotsDir, `${String(i + 1).padStart(2, '0')}-${sample.screen}.png`);
      reports.push(await checkRoute(sample, opts.theme, (url) => openRoute(context, url, sample.storage), shot || undefined));
    }
    await context.close();
    return reports;
  });
  // Titles compare across routes, so their findings join each route's after all are checked.
  for (const { route, finding: found } of titleStyles(perRoute))
    perRoute.find((report) => report.route === route)?.findings.push(found);
  writeJsonAtomic(runPath(opts.run, 'reports', 'rendered.json'), perRoute);
  const issues = perRoute.flatMap((report) =>
    report.findings.map((f): Issue => ({
      rule: f.rule,
      severity: f.severity,
      message: `${report.route}: ${f.message}`,
      ...(f.element !== undefined && { at: f.element }),
    })),
  );
  const shots = perRoute.flatMap((report, i) => {
    const screen = opts.routes[i]?.screen;
    return report.shot ? [{ label: `The screenshot of ${screen} at ${report.route}:`, file: report.shot }] : [];
  });
  return { issues, perRoute, shots };
}
