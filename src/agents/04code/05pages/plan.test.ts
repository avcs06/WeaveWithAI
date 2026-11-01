import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { WidgetScreens } from '../../02design/08assemble/assemble';
import { pageGroups, pageLinks } from './plan';

const golden = (idea: string) =>
  JSON.parse(readFileSync(`fixtures/golden/${idea}/02-design/08-assemble.json`, 'utf8')).data as WidgetScreens;

describe('the order the pages are built in', () => {
  const design = golden('freelancer-workspace');

  it("takes the pages a page's nodes and its dialogs' nodes open", () => {
    const links = pageLinks(design);
    expect([...(links.get('S05') ?? [])]).toEqual(['S06']);
    expect([...(links.get('S06') ?? [])].sort()).toEqual(['S05', 'S08']);
    expect([...(links.get('S10') ?? [])]).toEqual([]);
  });

  it('groups pages that open each other, and builds a group only after the groups it opens, in navigation order within a wave', () => {
    // Navigation order: S04, S05, S07, S09, S10, S11; pages outside it follow by id.
    expect(pageGroups(design).map((g) => [g.wave, g.pages.join('+'), g.opens.join(',')])).toEqual([
      [1, 'S05+S06+S08', ''],
      [1, 'S10', ''],
      [1, 'S11+S12', ''],
      [2, 'S07', 'S06,S08'],
      [3, 'S04+S09', 'S05,S07,S10,S06,S08'],
      [4, 'S02+S03', 'S04'],
      [5, 'S01', 'S11,S02,S03'],
    ]);
  });

  it('builds every page once, and no group before a page it opens', () => {
    const groups = pageGroups(design);
    expect(groups.flatMap((g) => g.pages).sort()).toEqual(design.screens.filter((s) => s.type === 'page').map((s) => s.id).sort());
    const waveOf = new Map(groups.flatMap((g) => g.pages.map((page) => [page, g.wave] as const)));
    for (const group of groups) for (const page of group.opens) expect(waveOf.get(page)).toBeLessThan(group.wave);
  });
});
