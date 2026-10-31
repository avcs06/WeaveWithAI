import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { layoutMutations } from '../../__fixtures__/layout-mutations';
import type { Inventory } from '../../../../ds/inventory';
import { makeScreensSchema, type Screens } from '../../schema';
import { skeleton } from '../skeleton/skeleton';
import { layoutRules, validateLayout } from './validation';

const read = (path: string) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as unknown;

const inventory = read(
  '../../../../ds/__fixtures__/inventory.json',
) as Inventory;

const schema = makeScreensSchema(inventory).Screens;

// Parsing through the schema also proves the fixture and its mutations are valid screens.
const screens = schema.parse(
  read('../../__fixtures__/reading-list.screens.json'),
) as Screens;

const layout = (s: Screens) =>
  validateLayout(schema.parse(s) as Screens, skeleton(s, inventory), inventory);

const ruleIds = (issues: { rule: string }[]) =>
  issues.map((issue) => issue.rule);

describe('layout rules on the reading-list fixture', () => {
  it('passes every layout rule, warnings included', () => {
    expect(layout(screens)).toEqual([]);
  });

  it('LAYOUT-010 finds the repeated items beside a heading and wants one gap of 8 to 16 between cards', () => {
    const cards = layoutMutations['LAYOUT-010']!(screens);
    for (const card of cards.nodes.filter((n) => n.section === 'S04.sec5'))
      card.box.minHeightPx = 120;
    cards.nodes.push({
      ...structuredClone(cards.nodes.find((n) => n.id === 'S04.n02')!),
      id: 'S04.n17',
      section: 'S04.sec5',
      parent: '',
      order: 0,
    });
    const ids = (s: Screens) =>
      layout(s).filter((issue) => issue.rule === 'LAYOUT-010');
    expect(ids(cards)).toEqual([]);
    cards.sections.find((sec) => sec.id === 'S04.sec5')!.layout.gap = '5';
    expect(ids(cards).map((issue) => issue.at)).toEqual(['S04.sec5']);
  });

  it('LAYOUT-063 checks confirmations only, not a dialog that edits and can also delete', () => {
    const editing = structuredClone(screens);
    editing.nodes.push({
      ...structuredClone(editing.nodes.find((n) => n.id === 'S07.n03')!),
      id: 'S05.n08',
      section: 'S05.sec2',
      order: 0,
    });
    expect(ruleIds(layout(editing))).not.toContain('LAYOUT-063');
  });

  it('pairs each layout rule with exactly one mutation', () => {
    expect(Object.keys(layoutMutations).sort()).toEqual(
      layoutRules.map((rule) => rule.id).sort(),
    );
  });

  it.each(layoutRules.map((rule) => [rule.id, rule.severity] as const))(
    '%s (%s) fires on its mutation and not on the valid fixture',
    (id, severity) => {
      const mutate = layoutMutations[id];
      if (!mutate) throw new Error(`no mutation for ${id}`);
      const issues = layout(mutate(screens)).filter(
        (issue) => issue.rule === id,
      );
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.every((issue) => issue.severity === severity)).toBe(true);
      expect(ruleIds(layout(screens))).not.toContain(id);
    },
  );
});
