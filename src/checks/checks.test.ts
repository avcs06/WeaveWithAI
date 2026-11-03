import {
  createReadStream,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Browser, chromium, type Page } from 'playwright-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRun } from '../core/run';
import { HEIGHT, openRoute, WIDTH } from './browser';
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
import { runRenderedChecks } from './index';
import { checkRoute } from './index';
import { keyboardWalk } from './keyboard';
import { contentEdge, frameParts, gridOrphans, pageTitle, spreadPairs, titleStyles } from './layout';
import type { Finding } from './types';

// Two static pages served over http: one clean, one with a planted defect for
// every rule. Each collector finds its defect and nothing on the clean page.

const fixtures = fileURLToPath(new URL('./__fixtures__/', import.meta.url));
const theme = {
  all: new Set(['#FFFFFF', '#18181B', '#3D63B8', '#5C5C64']),
  accent: new Set(['#3D63B8']),
};
let server: Server;
let base = '';
let browser: Browser;

beforeAll(async () => {
  server = createServer((req, res) => {
    const file = path.join(fixtures, path.basename(req.url ?? '/'));
    res.setHeader('content-type', 'text/html; charset=utf-8');
    createReadStream(file)
      .on('error', () => res.writeHead(404).end())
      .pipe(res);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
  browser = await chromium.launch();
}, 60_000);
afterAll(async () => {
  await browser.close();
  server.close();
});

async function open(file: string): Promise<Page> {
  // axe reads pages of a context it can see, not of browser.newPage().
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
  });
  const page = await context.newPage();
  await page.goto(base + file, { waitUntil: 'networkidle' });
  return page;
}
const rules = (findings: Finding[]) =>
  findings.map((f) => `${f.severity} ${f.element ?? ''} ${f.message}`);

describe('rendered checks on the fixture pages', () => {
  it('R-001 axe: the unnamed icon button is critical; the clean page has no violation', async () => {
    const bad = await axeCheck(await open('defects.html'));
    expect(bad.findings).toContainEqual(
      expect.objectContaining({
        rule: 'DESIGN-R-001',
        severity: 'mandatory',
        message: expect.stringContaining('button-name'),
      }),
    );
    expect((await axeCheck(await open('clean.html'))).findings).toEqual([]);
  });

  it('R-002 contrast: grey on white at about 3:1 fails', async () => {
    const bad = await contrastCheck(await open('defects.html'));
    expect(bad.failures).toEqual([
      expect.objectContaining({
        color: '#949494',
        background: '#FFFFFF',
        required: 4.5,
      }),
    ]);
    expect((await contrastCheck(await open('clean.html'))).findings).toEqual(
      [],
    );
  });

  it('R-003 keyboard: an unreachable link, a hidden focus, a tab order inversion, a fake button and no skip link', async () => {
    const bad = await keyboardWalk(await open('defects.html'), {
      blockMutations: true,
    });
    expect(rules(bad.findings)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(
          /^mandatory .*a:nth-of-type\(1\) not reachable with Tab$/,
        ),
        expect.stringMatching(
          /^mandatory .*button:nth-of-type\(4\) focus does not show/,
        ),
        expect.stringMatching(/^mandatory .*Tab goes back from/),
        'mandatory [data-testid="fake"] Enter does not activate it',
        'mandatory [data-testid="fake"] Space does not activate it',
        'warning  no skip link first in the tab order',
      ]),
    );
    expect(bad.inversions).toBe(1);
    const clean = await keyboardWalk(await open('clean.html'), {
      blockMutations: true,
    });
    expect(clean.findings).toEqual([]);
    expect(clean).toMatchObject({
      interactive: 2,
      reachable: 2,
      focusVisible: 2,
      trap: false,
      skipLink: true,
      activation: { buttons: 1, enterOk: 1, spaceOk: 1 },
    });
  });

  it('opens a route with its localStorage entries written before the page loads, as a signed-in session', async () => {
    const context = await browser.newContext();
    const page = await openRoute(context, `${base}clean.html`, { 'weave:auth': '{"state":{"user":{"email":"m@x.com"}}}' });
    expect(await page.evaluate(() => localStorage.getItem('weave:auth'))).toBe('{"state":{"user":{"email":"m@x.com"}}}');
    await context.close();
  });

  it('R-003 keyboard: a button that opens another page counts as acting, and the walk never leaves its route', async () => {
    const page = await open('navigates.html');
    const walk = await keyboardWalk(page, { blockMutations: true });
    expect(walk.activation).toEqual({ buttons: 3, enterOk: 3, spaceOk: 3 });
    expect(walk.findings.filter((f) => f.message.includes('does not activate'))).toEqual([]);
    expect(page.url()).toMatch(/navigates\.html$/);
  });

  it('stops an opened route\'s motion, so styles are measured at rest', async () => {
    const context = await browser.newContext();
    const page = await openRoute(context, `${base}navigates.html`);
    expect(await page.evaluate("getComputedStyle(document.querySelector('button')).transitionDuration")).toBe('0s');
    await context.close();
  });

  it("never tests the design system's own markup, and tests what the app put in a design-system slot", async () => {
    const context = await browser.newContext();
    const sample = { route: '/', url: `${base}design-system.html`, screen: 'S01', entry: false };
    const report = await checkRoute(sample, theme, (url) => openRoute(context, url));
    const of = (rule: string) => report.findings.filter((f) => f.rule === rule);
    // All three buttons are unnamed and 12px; nothing filters findings, so only the two the app made were tested.
    expect(of('DESIGN-R-004').map((f) => f.element)).toEqual(['[data-testid="S01.n02"] > button:nth-of-type(1)', '#slotted']);
    expect(of('DESIGN-R-001').filter((f) => f.message.startsWith('button-name'))).toHaveLength(2);
    expect(report.metrics.keyboard).toMatchObject({ interactive: 2, activation: { buttons: 2, enterOk: 2, spaceOk: 2 } });
    // Contrast is tested on the design system's text too; its text size is not.
    expect(of('DESIGN-R-002').map((f) => f.element)).toContain('#ds-grey');
    expect(of('DESIGN-R-007').map((f) => f.element)).not.toContain('#ds-small');
    // Spacing the design system set through asChild (data-slot) is its own; the same spacing set by the app is tested.
    expect([...of('DESIGN-R-010'), ...of('DESIGN-R-011')].map((f) => f.element)).toEqual(['#app-row', '#app-row']);
    await context.close();
  });

  it('turns a check that breaks into a warning on its rule, and finishes the route', async () => {
    const report = await checkRoute(
      { route: '/', url: `${base}clean.html`, screen: 'S01', entry: true },
      theme,
      async (url) => {
        const page = await (await browser.newContext()).newPage();
        await page.goto(url);
        await page.close();
        return page;
      },
    );
    expect(report.findings.length).toBeGreaterThan(0);
    expect(report.findings.every((f) => f.severity === 'warning' && f.message.startsWith('the check could not finish'))).toBe(true);
    expect(new Set(report.findings.map((f) => f.rule))).toContain('DESIGN-R-003');
  });

  it('R-004 targets: two 12 px buttons whose circles overlap fail; a 12 px button with room passes; the clean page passes', async () => {
    const bad = await targetSizes(await open('defects.html'));
    // Named from the nearest node with a test id, as the code names it.
    const crowded = (n: number) =>
      expect.objectContaining({
        severity: 'mandatory',
        message: 'target is 12 by 12 and another target is too close; make it at least 24 by 24, or keep other targets clear of a 24px circle on its center',
        element: `[data-testid="crowded"] > button:nth-of-type(${n})`,
      });
    expect(bad.findings).toEqual([crowded(1), crowded(2)]);
    expect(bad.small24).toBe(3);
    expect((await targetSizes(await open('clean.html'))).findings).toEqual([]);
  });

  it('R-004 targets: WCAG 2.5.8 passes small links in a sentence and a small link with room; small links in no sentence fail', async () => {
    const found = await targetSizes(await open('targets.html'));
    expect(found.findings.map((f) => f.element)).toEqual(['[data-testid="nav-a"]', '[data-testid="nav-b"]']);
    expect(found.small24).toBe(5);
  });

  it('R-003 keyboard: a menu button that opens on keydown and cancels the click acts, by its menu and aria-expanded', async () => {
    const walk = await keyboardWalk(await open('menu.html'), { blockMutations: true });
    expect(walk.findings.filter((f) => f.message.includes('activate'))).toEqual([]);
    expect(walk.activation).toEqual({ buttons: 1, enterOk: 1, spaceOk: 1 });
  });

  it('R-003 keyboard: focus that cycles among three buttons is a trap; a native date input, which holds Tab over its parts, is none', async () => {
    const trapped = await keyboardWalk(await open('trap.html'), { blockMutations: true });
    expect(trapped.trap).toBe(true);
    expect(rules(trapped.findings)).toContain('mandatory  focus stays among 3 controls and never leaves');
    const dated = await keyboardWalk(await open('date-input.html'), { blockMutations: true });
    expect(dated.trap).toBe(false);
    expect(dated.findings.filter((f) => f.severity === 'mandatory')).toEqual([]);
    expect(dated.reachable).toBe(3);
  });

  it('R-005 overflow, R-006 first viewport', async () => {
    const page = await open('defects.html');
    expect(await overflowCheck(page)).toEqual([
      expect.objectContaining({
        message: expect.stringMatching(/^page is \d+px wide$/),
      }),
    ]);
    expect(await firstViewport(page)).toEqual([
      expect.objectContaining({
        element: 'h1',
        message: expect.stringContaining('below the first 900'),
      }),
    ]);
    const clean = await open('clean.html');
    expect(await overflowCheck(clean)).toEqual([]);
    expect(await firstViewport(clean)).toEqual([]);
  });

  it('R-009 target gaps, R-010 nesting and R-011 padding: planted on the defects page, none on the clean page', async () => {
    const page = await open('defects.html');
    expect(rules(await targetGaps(page))).toEqual([
      'mandatory [data-testid="tight"] > button:nth-of-type(1) [data-testid="tight"] > button:nth-of-type(1) and [data-testid="tight"] > button:nth-of-type(2) are 4px apart; controls sit at least 8px apart',
    ]);
    expect((await containerSpacing(page)).map((f) => [f.rule, f.severity, f.element, f.message])).toEqual([
      ['DESIGN-R-010', 'mandatory', '[data-testid="loose"]', expect.stringMatching(/^gap 32px inside body > section:nth-of-type\(3\), whose gap is 24px/)],
      ['DESIGN-R-011', 'mandatory', '[data-testid="cramped"]', 'padding 4px with a gap of 16px; a container\'s padding is at least its gap'],
    ]);
    const clean = await open('clean.html');
    expect(await targetGaps(clean)).toEqual([]);
    expect(await containerSpacing(clean)).toEqual([]);
  });

  it('R-012 numerals: a standalone number in the text font on the defects page; a Numeral and a number in a sentence pass', async () => {
    expect(rules(await numerals(await open('defects.html')))).toEqual([
      'mandatory [data-testid="plain-number"] wrap the number "1,834" in Numeral from @packages/ui/Numeral: a number the user reads and compares is set in the mono font',
    ]);
    expect(await numerals(await open('clean.html'))).toEqual([]);
  });

  it('R-014 content edge, R-015 spread pairs, R-016 grid orphans: planted on the defects page, none on the clean page', async () => {
    const page = await open('defects.html');
    expect(rules(await contentEdge(page))).toEqual([
      expect.stringMatching(/^mandatory \[data-testid="indented"\] starts 20px right of the page container's content edge/),
    ]);
    expect(rules(await spreadPairs(page))).toEqual([
      expect.stringMatching(/^mandatory \[data-testid="spread"\] "Pickup" and "Free" sit \d+px apart in a 900px row/),
    ]);
    expect(rules(await gridOrphans(page))).toEqual([
      expect.stringMatching(/^mandatory \[data-testid="orphan"\] 4 items in 3 columns leave one alone/),
    ]);
    const clean = await open('clean.html');
    expect(await contentEdge(clean)).toEqual([]);
    expect(await spreadPairs(clean)).toEqual([]);
    expect(await gridOrphans(clean)).toEqual([]);
    // A lone block of columns is a block itself, and a heading spanning a grid's row fills it.
    const layout = await open('layout.html');
    expect(await contentEdge(layout)).toEqual([]);
    expect(await gridOrphans(layout)).toEqual([]);
  });

  it('R-017 frame parts: a page with no PageHeader, PageLogo or UserMenu fails; the clean page has all three', async () => {
    expect(rules(await frameParts(await open('defects.html')))).toEqual([
      expect.stringMatching(/^mandatory  The page has no PageHeader/),
      expect.stringMatching(/^mandatory  The frame shows no PageLogo/),
      expect.stringMatching(/^mandatory  The frame shows no UserMenu/),
    ]);
    expect(await frameParts(await open('clean.html'))).toEqual([]);
  });

  it('R-013 titles: a route whose H1 looks unlike the PageHeader title fails; the hero is left out', async () => {
    const clean = await pageTitle(await open('clean.html'));
    const defects = await pageTitle(await open('defects.html'));
    expect(clean).toMatchObject({ pageHeader: true });
    expect(defects).toMatchObject({ pageHeader: false });
    const found = titleStyles([
      { route: '/defects', title: defects },
      { route: '/clean', title: clean },
      { route: '/', title: null },
    ]);
    expect(found.map(({ route, finding }) => [route, finding.rule, finding.severity])).toEqual([
      ['/defects', 'DESIGN-R-013', 'mandatory'],
    ]);
    expect(found[0]?.finding.message).toContain('line-height');
    // With no PageHeader, most routes set the style.
    const header = { element: 'h1', pageHeader: false, style: { 'font-size': '24px' } };
    expect(
      titleStyles([
        { route: '/a', title: header },
        { route: '/b', title: header },
        { route: '/c', title: { ...header, style: { 'font-size': '14px' } } },
      ]).map(({ route }) => route),
    ).toEqual(['/c']);
  });

  it('R-007 typography, R-008 colors', async () => {
    const page = await open('defects.html');
    expect(rules(await typography(page))).toEqual(
      expect.arrayContaining([
        expect.stringMatching(
          /^warning .* text is 12px; body text is at least 14px$/,
        ),
        expect.stringMatching(
          /^warning .* paragraph runs about \d+ characters a line; keep 45 to 90$/,
        ),
      ]),
    );
    expect((await colorVariables(page, theme)).map((f) => f.message)).toEqual(
      expect.arrayContaining([
        'color #949494 is not a theme color',
        'color #333333 is not a theme color',
      ]),
    );
    const clean = await open('clean.html');
    expect(await typography(clean)).toEqual([]);
    expect(await colorVariables(clean, theme)).toEqual([]);
  });
});

describe('runRenderedChecks', () => {
  const runsDir = mkdtempSync(path.join(tmpdir(), 'weave-checks-'));
  afterAll(() => rmSync(runsDir, { recursive: true, force: true }));

  it('checks each route and writes reports/rendered.json', async () => {
    const idea = path.join(runsDir, 'idea.md');
    writeFileSync(idea, '# Idea\n');
    const run = createRun({ idea, runsDir, id: 'checks' });
    const route = (name: string) => ({
      route: `/${name}`,
      url: `${base}${name}.html`,
      screen: 'S01',
      entry: true,
    });
    const { issues, perRoute } = await runRenderedChecks({
      run,
      routes: [route('clean'), route('defects')],
      theme,
    });
    expect(perRoute.map((r) => r.route)).toEqual(['/clean', '/defects']);
    expect(issues.filter((i) => i.message.startsWith('/clean'))).toEqual([]);
    const failed = new Set(
      issues.filter((i) => i.severity === 'mandatory').map((i) => i.rule),
    );
    expect([...failed].sort()).toEqual([
      'DESIGN-R-001',
      'DESIGN-R-002',
      'DESIGN-R-003',
      'DESIGN-R-004',
      'DESIGN-R-005',
      'DESIGN-R-006',
      'DESIGN-R-009',
      'DESIGN-R-010',
      'DESIGN-R-011',
      'DESIGN-R-012',
      'DESIGN-R-013',
      'DESIGN-R-014',
      'DESIGN-R-015',
      'DESIGN-R-016',
      'DESIGN-R-017',
    ]);
    const written = JSON.parse(
      readFileSync(path.join(run.dir, 'reports', 'rendered.json'), 'utf8'),
    ) as unknown[];
    expect(written).toHaveLength(2);
  }, 120_000);
});
