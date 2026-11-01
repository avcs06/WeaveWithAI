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
import type { Finding } from './types';

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

/** The theme's colors as hex, and the accent ones among them. */
export type ThemeColors = { all: Set<string>; accent: Set<string> };

export async function checkRoute(
  sample: RouteSample,
  theme: ThemeColors,
  open: (url: string) => Promise<import('playwright-core').Page>,
): Promise<RenderedReport> {
  const page = await open(sample.url);
  try {
    const axe = await axeCheck(page);
    const contrast = await contrastCheck(page);
    const targets = await targetSizes(page);
    const rest = [
      ...(await overflowCheck(page)),
      ...(sample.entry ? await firstViewport(page, sample.primaryTestIds) : []),
      ...(await typography(page)),
      ...(await colorVariables(page, theme)),
      ...(await proximity(page)),
    ];
    // Last: the walk presses keys and may open and close things.
    const { findings: walked, ...keyboard } = await keyboardWalk(page, {
      blockMutations: true,
      dialogTriggers: sample.dialogTriggers ?? [],
    });
    return {
      route: sample.route,
      findings: [
        ...axe.findings,
        ...contrast.findings,
        ...targets.findings,
        ...rest,
        ...walked,
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
        await checkRoute(sample, opts.theme, (url) => openRoute(context, url)),
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
