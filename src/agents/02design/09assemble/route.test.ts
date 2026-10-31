import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Issue } from '../../../core/issues';
import { builds, designs, frames, ia, inventory } from '../__fixtures__/widgets';
import { assembleScreens } from './assemble';
import { inCallTerms, ownersOf, routeIssues } from './route';
import { Brief } from '../01brief/schema';
import { makeThemeSchema } from '../02theme/schema';
import { buildTheme } from '../02theme/build';

const read = (file: string): unknown =>
  JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'));
const brief = Brief.parse(read('../__fixtures__/reading-list.brief.json'));
const theme = buildTheme(
  brief,
  makeThemeSchema(brief, inventory).parse(
    read('../__fixtures__/reading-list.theme.json'),
  ),
);
const { screens, origin } = assembleScreens(ia, designs, builds, frames, theme);
const issue = (rule: string, at: string, message = 'm'): Issue => ({
  rule,
  severity: 'mandatory',
  message,
  at,
});

describe('ownersOf', () => {
  it("sends a node's or a section's issue to the widget placed there, and a shell node's to its frame", () => {
    expect(ownersOf(issue('LAYOUT-011', 'S05.n06'), screens)).toEqual(['W10']);
    expect(ownersOf(issue('LAYOUT-035', 'S04.sec4'), screens)).toEqual(['W08']);
    expect(ownersOf(issue('LAYOUT-001', 'SH2.n01'), screens)).toEqual(['SH2']);
    expect(ownersOf(issue('DESIGN-024', 'SH1.r1'), screens)).toEqual(['SH1']);
  });

  it('sends a step without its control to the widgets serving it, an unused component to the widgets meant to use it, and an undrawn item to the frames', () => {
    expect(ownersOf(issue('DESIGN-008', 'F03.S01'), screens)).toEqual([
      'W05',
      'W08',
    ]);
    expect(ownersOf(issue('DESIGN-003', 'TitleCover'), screens)).toEqual([
      'W12',
    ]);
    expect(ownersOf(issue('DESIGN-025', 'S04'), screens)).toEqual([
      'SH2',
      'SH1',
    ]);
  });

  it('keeps an issue on a screen, a region or the plan for no call: the IA is not rerun, the theme owns regions', () => {
    expect(ownersOf(issue('DESIGN-017', 'S06'), screens)).toEqual([]);
    expect(ownersOf(issue('LAYOUT-071', 'SH1.r1'), screens)).toEqual([]);
    expect(ownersOf(issue('LAYOUT-028', 'S01'), screens)).toEqual([]);
  });
});

describe('routeIssues', () => {
  it('sorts mandatory issues by the call that fixes them, in its own ids, keeps the rest known and drops warnings', () => {
    const { calls, known } = routeIssues(
      [
        issue('LAYOUT-011', 'S05.n07', 'S05.n07 is 24 from S05.n06.'),
        issue('DESIGN-017', 'S06'),
        { ...issue('LAYOUT-020', 'S01.n08'), severity: 'warning' },
      ],
      screens,
      origin,
    );
    expect([...calls]).toEqual([
      [
        'W10',
        [
          issue(
            'LAYOUT-011',
            'W10.n02',
            'W10.n02 (as S05.n07) is 24 from W10.n01 (as S05.n06).',
          ),
        ],
      ],
    ]);
    expect(known.map((i) => i.rule)).toEqual(['DESIGN-017']);
  });

  it("names a section by its widget and leaves a frame's ids as they are", () => {
    expect(
      inCallTerms(
        issue('LAYOUT-035', 'S04.sec4', 'S04.sec4 has two actions.'),
        screens,
        origin,
      ),
    ).toMatchObject({
      at: 'W08',
      message: 'W08 (as S04.sec4) has two actions.',
    });
    expect(
      inCallTerms(
        issue('LAYOUT-001', 'SH1.n02', 'SH1.n02 is close.'),
        screens,
        origin,
      ),
    ).toMatchObject({
      at: 'SH1.n02',
      message: 'SH1.n02 is close.',
    });
  });
});
