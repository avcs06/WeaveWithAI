import { describe, expect, it } from 'vitest';
import type { Issue } from '../../../../core/issues';
import { catalog, ctx, inventory, layouts, plan, theme } from '../../__fixtures__/chain';
import type { Processed as Catalog } from '../../04catalog/process';
import type { ScreenLayout } from '../schema';
import { contentWidth, gapOf } from '../width';
import { screenRules, validateLayouts } from './validation';

const rules = (issues: Issue[]) => [...new Set(issues.map((i) => i.rule))];
const measure = (id: string) => {
  const screen = plan.screens.find((s) => s.id === id);
  return screen
    ? { width: contentWidth(screen, theme, inventory), gapPx: gapOf(screen, theme, inventory) }
    : { width: 0, gapPx: 0 };
};
const ids = layouts.map((l) => l.screen);
const check = (screens: ScreenLayout[], on: Catalog = catalog, given = ids) =>
  validateLayouts({ screens }, given, plan, on, ctx, measure);

function changed(change: (copy: ScreenLayout[]) => void): ScreenLayout[] {
  const copy = structuredClone(layouts);
  change(copy);
  return copy;
}

const instance = (l: ScreenLayout[], id: string) => {
  const found = l.flatMap((s) => s.instances).find((i) => i.id === id);
  if (!found) throw new Error(`no instance ${id}`);
  return found;
};

describe('the reading-list layouts', () => {
  it('pass every screen rule, warnings included', () => {
    expect(check(layouts)).toEqual([]);
  });
});

const cases: Record<string, (l: ScreenLayout[]) => void> = {
  'DESIGN-001': (l) => (instance(l, 'S04.p2').id = 'p2'),
  'DESIGN-029': (l) => {
    const shelf = l.find((s) => s.screen === 'S04')!;
    shelf.instances = shelf.instances.filter((i) => i.id !== 'S04.p2');
  },
  'DESIGN-030': (l) => (instance(l, 'S06.p2').headingLevel = 3),
  // A 480 detail beside a fixed 1200 panel, 24 apart, in the book page's column.
  'DESIGN-037': (l) => (instance(l, 'S06.p2').widthPx = 1200),
  'DESIGN-039': (l) => (instance(l, 'S04.p2').height = 'fill'),
};

describe('the screen rules', () => {
  it('pairs each rule with one case', () => {
    expect([...Object.keys(cases), 'DESIGN-038', 'DESIGN-048'].sort()).toEqual(screenRules.map((r) => r.id).sort());
  });

  it("DESIGN-048 wants each words slot of a confirmation one sentence, and the record named beside its title", () => {
    // The delete-book dialog's text becomes a words slot that its instance fills.
    const slotted = structuredClone(catalog);
    slotted.widgets.find((w) => w.id === 'W10')!.slots.push({ name: 'description', kind: 'words', holds: 'what is destroyed', minWidthPx: 160, maxWidthPx: 0 });
    const at = (words: string) =>
      check(changed((l) => instance(l, 'S07.p1').slots.push({ name: 'description', text: words })), slotted)
        .filter((i) => i.rule === 'DESIGN-048')
        .map((i) => i.at);
    expect(at('This removes “{Book.title}” from your shelf for good.')).toEqual([]);
    expect(at('This removes the book for good.')).toEqual(['S07.p1']);
    expect(at('This removes “{Book.title}”. It cannot be undone.')).toEqual(['S07.p1']);
  });

  it.each(Object.keys(cases))('%s fails its case', (rule) => {
    expect(rules(check(changed(cases[rule]!)))).toContain(rule);
  });

  it('DESIGN-038 wants words for each words slot and no other, and a fixed width inside the range of what it places', () => {
    const at = (change: (l: ScreenLayout[]) => void) =>
      check(changed(change)).map((i) => [i.rule, i.at]);
    // The header's title is also the page's title, so DESIGN-030 fires beside it.
    expect(at((l) => (instance(l, 'S04.p1').slots = []))).toContainEqual(['DESIGN-038', 'S04.p1']);
    expect(at((l) => instance(l, 'S04.p2').slots.push({ name: 'title', text: 'Books' }))).toEqual([
      ['DESIGN-038', 'S04.p2'],
    ]);
    // The side panel runs 240 to 360.
    expect(at((l) => (instance(l, 'S06.p2').widthPx = 200))).toEqual([['DESIGN-038', 'S06.p2']]);
  });

  it('DESIGN-038 wants an instance in a slot no wider than the slot', () => {
    const slotted = structuredClone(catalog);
    slotted.widgets
      .find((w) => w.id === 'W08')!
      .slots.push({ name: 'aside', kind: 'parts', holds: 'the shelf panel', minWidthPx: 0, maxWidthPx: 200 });
    const moved = changed((l) => (instance(l, 'S06.p2').in = 'S06.p1/aside'));
    expect(check(moved, slotted).map((i) => [i.rule, i.at])).toEqual([['DESIGN-038', 'S06.p2']]);
  });

  it('DESIGN-029 wants every instance in a box of its screen or in a parts slot of an instance there', () => {
    const at = (where: string) =>
      check(changed((l) => (instance(l, 'S06.p2').in = where))).map((i) => [i.rule, i.at]);
    expect(at('S06.b9')).toEqual([['DESIGN-029', 'S06.p2']]);
    // W08 has no slots, and a words slot never holds instances.
    expect(at('S06.p1/body')).toEqual([['DESIGN-029', 'S06.p2']]);
  });

  it("DESIGN-030 wants one level 1 on a page, showing its title word for word, and none in a dialog", () => {
    const at = (change: (l: ScreenLayout[]) => void, on: Catalog = catalog) =>
      check(changed(change), on).map((i) => [i.rule, i.at]);
    expect(at((l) => (instance(l, 'S04.p1').slots[0]!.text = 'Shelf'))).toEqual([['DESIGN-030', 'S04.p1']]);
    expect(at((l) => (instance(l, 'S04.p1').headingLevel = 2))).toEqual([
      ['DESIGN-030', 'S04.p1'],
      ['DESIGN-030', 'S04'],
    ]);
    const titled = structuredClone(catalog);
    titled.widgets.find((w) => w.id === 'W10')!.containsHeading = true;
    expect(at((l) => (instance(l, 'S07.p1').headingLevel = 1), titled)).toEqual([['DESIGN-030', 'S07.p1']]);
    // A dialog's name is its level 1, so its first heading at 2 skips nothing.
    expect(at((l) => (instance(l, 'S07.p1').headingLevel = 2), titled)).toEqual([]);
  });

  it('wants each screen it was given laid out once, and no other', () => {
    const at = (screens: ScreenLayout[], given = ids) =>
      check(screens, catalog, given).map((i) => [i.rule, i.at]);
    expect(at(layouts.filter((l) => l.screen !== 'S05'))).toEqual([['DESIGN-029', 'S05']]);
    expect(at([...layouts, layouts[0]!])).toEqual([['DESIGN-029', 'S01']]);
    expect(at(layouts, ids.filter((id) => id !== 'S07'))).toEqual([['DESIGN-029', 'S07']]);
  });
});
