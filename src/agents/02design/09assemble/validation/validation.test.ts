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
    for (const card of cards.nodes.filter((n) => n.section === 'S04.sec3'))
      card.box.minHeightPx = 120;
    cards.nodes.push({
      ...structuredClone(cards.nodes.find((n) => n.id === 'S04.n02')!),
      id: 'S04.n19',
      section: 'S04.sec3',
      parent: '',
      order: 0,
    });
    const ids = (s: Screens) =>
      layout(s).filter((issue) => issue.rule === 'LAYOUT-010');
    cards.sections.find((sec) => sec.id === 'S04.sec3')!.layout.align = 'stretch';
    expect(ids(cards)).toEqual([]);
    cards.sections.find((sec) => sec.id === 'S04.sec3')!.layout.gap = '5';
    expect(ids(cards).map((issue) => issue.at)).toEqual(['S04.sec3']);
  });

  it('LAYOUT-063 checks confirmations only, not a dialog that edits and can also delete', () => {
    const editing = structuredClone(screens);
    editing.nodes.push({
      ...structuredClone(editing.nodes.find((n) => n.id === 'S07.n03')!),
      id: 'S05.n09',
      section: 'S05.sec1',
      order: 0,
    });
    expect(ruleIds(layout(editing))).not.toContain('LAYOUT-063');
  });

  it("LAYOUT-035 checks a list's own empty state, and every node of an empty-state section", () => {
    const at = (s: Screens) =>
      layout(s)
        .filter((issue) => issue.rule === 'LAYOUT-035')
        .map((issue) => issue.at);
    expect(at(layoutMutations['LAYOUT-035']!(screens))).toEqual(['S04.n16']);
    const uncentred = structuredClone(screens);
    uncentred.nodes.find((n) => n.id === 'S04.n16')!.layout!.align = 'start';
    expect(at(uncentred)).toEqual(['S04.n16']);
    // The same empty state as a section of its own, without its icon.
    const apart = structuredClone(screens);
    apart.sections.push({
      ...structuredClone(apart.sections.find((sec) => sec.id === 'S04.sec2')!),
      id: 'S04.sec3',
      order: 3,
      kind: 'empty-state',
      layout: { ...apart.nodes.find((n) => n.id === 'S04.n16')!.layout!, padding: '0' },
    });
    for (const n of apart.nodes)
      if (n.id === 'S04.n13' || n.id === 'S04.n14') Object.assign(n, { section: 'S04.sec3', parent: '' });
    apart.nodes = apart.nodes.filter((n) => n.id !== 'S04.n12' && n.id !== 'S04.n16');
    expect(at(apart)).toEqual(['S04.sec3']);
  });

  it('LAYOUT-026 holds a field to 160, but not a chip, a checkbox or a switch', () => {
    const chips = structuredClone(screens);
    const search = chips.nodes.find((n) => n.id === 'S04.n07')!;
    search.box = { ...search.box, widthPx: 80 };
    expect(ruleIds(layout(chips))).toContain('LAYOUT-026');
    search.component = 'Chip';
    expect(ruleIds(layout(chips))).not.toContain('LAYOUT-026');
  });

  it('LAYOUT-038 and LAYOUT-039 take a Card in a CardGroup as an option of a field, in a form or a dialog', () => {
    const choice = structuredClone(screens);
    const field = choice.nodes.find((n) => n.id === 'S05.n03')!;
    Object.assign(field, { component: 'CardGroup', role: 'input', layout: { direction: 'row', gap: '3', padding: '0', columns: 0, align: 'stretch', justify: 'start', wrap: true } });
    for (const [i, text] of ['To read', 'Reading'].entries())
      choice.nodes.push({
        ...structuredClone(field),
        id: `S05.n1${i}`,
        parent: 'S05.n03',
        order: i + 1,
        component: 'Card',
        role: 'display',
        layout: null,
        text,
        field: '',
        box: { width: 'fixed', widthPx: 240, height: 'content', heightPx: 0, minHeightPx: 0, span: 1 },
      });
    const ids = ruleIds(layout(choice));
    expect(ids).not.toContain('LAYOUT-038');
    expect(ids).not.toContain('LAYOUT-039');
    // The same cards outside a group are boxes in a form and in a dialog.
    field.component = 'none';
    expect(ruleIds(layout(choice))).toEqual(expect.arrayContaining(['LAYOUT-038', 'LAYOUT-039']));
  });

  it("LAYOUT-035 leaves a one-line empty message inside a card or a form alone", () => {
    const form = structuredClone(screens);
    form.nodes.push({ ...structuredClone(form.nodes.find((n) => n.id === 'S05.n03')!), id: 'S05.n09', order: 7, role: 'text', component: 'none', field: '', flowSteps: [], states: ['empty'], text: 'No shelves yet.' });
    expect(ruleIds(layout(form))).not.toContain('LAYOUT-035');
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
