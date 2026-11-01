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
  contrastCheck,
  firstViewport,
  overflowCheck,
  proximity,
  targetSizes,
  typography,
} from './collectors';
import { runRenderedChecks } from './index';
import { checkRoute } from './index';
import { keyboardWalk } from './keyboard';
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
      dialogTriggers: ['add-book'],
    });
    expect(clean.findings).toEqual([]);
    expect(clean).toMatchObject({
      interactive: 2,
      reachable: 2,
      focusVisible: 2,
      trap: false,
      skipLink: true,
      activation: { buttons: 1, enterOk: 1, spaceOk: 1 },
      dialogs: { opened: 1, escaped: 1, focusReturned: 1 },
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
    const sample = { route: '/', url: `${base}design-system.html`, screen: 'S01', entry: false, primaryTestIds: [] };
    const report = await checkRoute(sample, theme, (url) => openRoute(context, url));
    const of = (rule: string) => report.findings.filter((f) => f.rule === rule);
    // All three buttons are unnamed and 12px; nothing filters findings, so only the two the app made were tested.
    expect(of('DESIGN-R-004').map((f) => f.element)).toEqual(['[data-testid="S01.n02"] > button:nth-of-type(1)', '#slotted']);
    expect(of('DESIGN-R-001').filter((f) => f.message.startsWith('button-name'))).toHaveLength(2);
    expect(report.metrics.keyboard).toMatchObject({ interactive: 2, activation: { buttons: 2, enterOk: 2, spaceOk: 2 } });
    // Contrast is tested on the design system's text too; its text size is not.
    expect(of('DESIGN-R-002').map((f) => f.element)).toContain('#ds-grey');
    expect(of('DESIGN-R-007').map((f) => f.element)).not.toContain('#ds-small');
    await context.close();
  });

  it('turns a check that breaks into a warning on its rule, and finishes the route', async () => {
    const report = await checkRoute(
      { route: '/', url: `${base}clean.html`, screen: 'S01', entry: true, primaryTestIds: [] },
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

  it('R-004 targets: a 12 px button fails; the clean page passes', async () => {
    const bad = await targetSizes(await open('defects.html'));
    // Named from the nearest node with a test id, as the code names it.
    expect(bad.findings).toEqual([
      expect.objectContaining({
        severity: 'mandatory',
        message: 'target is 12 by 12; at least 24 by 24',
        element: '[data-testid="controls"] > button:nth-of-type(3)',
      }),
    ]);
    expect((await targetSizes(await open('clean.html'))).findings).toEqual([]);
  });

  it('R-005 overflow, R-006 first viewport', async () => {
    const page = await open('defects.html');
    expect(await overflowCheck(page)).toEqual([
      expect.objectContaining({
        message: expect.stringMatching(/^page is \d+px wide$/),
      }),
    ]);
    expect(await firstViewport(page, ['primary'])).toEqual([
      expect.objectContaining({
        element: 'h1',
        message: expect.stringContaining('below the first 900'),
      }),
    ]);
    const clean = await open('clean.html');
    expect(await overflowCheck(clean)).toEqual([]);
    expect(await firstViewport(clean, ['add-book'])).toEqual([]);
  });

  it('R-007 typography, R-008 colors, R-009 proximity', async () => {
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
    expect(rules(await proximity(page))).toEqual([
      expect.stringMatching(
        /is 8 below .*, not more than the \d+ inside them$/,
      ),
    ]);
    const clean = await open('clean.html');
    expect(await typography(clean)).toEqual([]);
    expect(await colorVariables(clean, theme)).toEqual([]);
    expect(await proximity(clean)).toEqual([]);
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
      primaryTestIds: [name === 'clean' ? 'add-book' : 'primary'],
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
    ]);
    const written = JSON.parse(
      readFileSync(path.join(run.dir, 'reports', 'rendered.json'), 'utf8'),
    ) as unknown[];
    expect(written).toHaveLength(2);
  }, 120_000);
});
