import { describe, expect, it } from 'vitest';
import type { Issue } from '../../../core/issues';
import { chain, theme } from '../__fixtures__/chain';
import { assembleChain } from './assemble';
import { inCallTerms, ownersOf, routeIssues } from './route';

const { screens, origin } = assembleChain(chain, theme);
const issue = (rule: string, at: string, message = 'm'): Issue => ({
  rule,
  severity: 'mandatory',
  message,
  at,
});
const owners = (rule: string, at: string) => ownersOf(issue(rule, at), screens, origin);

describe('ownersOf', () => {
  it("sends a node's issue to the call that wrote it, a section's to the widget placed there, and a shell node's to its frame", () => {
    expect(owners('LAYOUT-011', 'S05.n06')).toEqual(['W07']);
    expect(owners('LAYOUT-001', 'S04.sec2')).toEqual(['W06']);
    expect(owners('LAYOUT-001', 'SH2.n01')).toEqual(['SH2']);
    expect(owners('LAYOUT-001', 'SH1.S04.n01')).toEqual(['SH1']);
    expect(owners('DESIGN-024', 'SH1.r1')).toEqual(['SH1']);
    expect(owners('LAYOUT-071', 'SH1.r1')).toEqual(['SH1']);
  });

  it('sends a step without its control to the widgets serving it, an unused component to the widgets meant to hold it, and an undrawn item to the frames', () => {
    expect(owners('DESIGN-008', 'F03.S01')).toEqual(['W05', 'W06']);
    expect(owners('DESIGN-003', 'TitleCover')).toEqual(['W09']);
    expect(owners('DESIGN-025', 'S04')).toEqual(['SH2', 'SH1']);
    expect(owners('LAYOUT-063', 'S07')).toEqual(['W10', 'W11']);
  });

  it('keeps for no call an issue on a screen, a region, the plan or a component placed on its own: those calls are not rerun', () => {
    expect(owners('DESIGN-017', 'S06')).toEqual([]);
    expect(owners('LAYOUT-006', 'SH1.r1')).toEqual([]);
    expect(owners('LAYOUT-028', 'S01')).toEqual([]);
    const own = new Map([...origin, ['S06.n30', 'TitleCover'], ['S06.n31', 'TitleCover.n01']]);
    expect(ownersOf(issue('LAYOUT-046', 'S06.n30'), screens, own)).toEqual([]);
    expect(ownersOf(issue('LAYOUT-046', 'S06.n31'), screens, own)).toEqual([]);
  });
});

describe('routeIssues', () => {
  it('sorts mandatory issues by the call that fixes them, in its own ids, keeps the rest known and drops warnings', () => {
    const { calls, known } = routeIssues(
      [
        issue('LAYOUT-011', 'S05.n06', 'S05.n06 is 24 from S05.n05.'),
        issue('DESIGN-017', 'S06'),
        { ...issue('LAYOUT-020', 'S01.n08'), severity: 'warning' },
      ],
      screens,
      origin,
    );
    expect([...calls]).toEqual([
      ['W07', [issue('LAYOUT-011', 'W07.n06', 'W07.n06 (as S05.n06) is 24 from W07.n05 (as S05.n05).')]],
    ]);
    expect(known.map((i) => i.rule)).toEqual(['DESIGN-017']);
  });

  it("names a section by its widget and leaves a frame's ids as they are", () => {
    expect(inCallTerms(issue('LAYOUT-001', 'S04.sec2', 'S04.sec2 is spaced wide.'), screens, origin)).toMatchObject({
      at: 'W06',
      message: 'W06 (as S04.sec2) is spaced wide.',
    });
    expect(inCallTerms(issue('LAYOUT-001', 'SH1.n02', 'SH1.n02 is close.'), screens, origin)).toMatchObject({
      at: 'SH1.n02',
      message: 'SH1.n02 is close.',
    });
  });
});
