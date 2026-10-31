import { describe, expect, it } from 'vitest';
import type { Issue } from '../../../../core/issues';
import { catalogCall, ctx, flows, inventory, plan, theme } from '../../__fixtures__/chain';
import type { Processed as Plan } from '../../03architect/process';
import { contentWidth } from '../../05screen/width';
import { sizes } from '../../09assemble/skeleton/boxes';
import { processCatalog } from '../process';
import type { Catalog } from '../schema';
import { catalogRules, validateCatalog } from './validation';

const rules = (issues: Issue[]) => [...new Set(issues.map((i) => i.rule))];
const px = sizes(inventory, []).spacing;
const widthOf = (id: string) => {
  const screen = plan.screens.find((s) => s.id === id);
  return screen ? contentWidth(screen, theme, inventory) : 0;
};
const check = (catalog: Catalog, on: Plan = plan) =>
  validateCatalog(processCatalog(catalog, flows, px), on, ctx, widthOf);

function changed(change: (copy: Catalog) => void): Catalog {
  const copy = structuredClone(catalogCall);
  change(copy);
  return copy;
}

const widget = (c: Catalog, id: string) => {
  const found = c.widgets.find((w) => w.id === id);
  if (!found) throw new Error(`the catalog has no ${id}`);
  return found;
};

describe('the reading-list catalog', () => {
  it('passes every catalog rule after its processing step, warnings included', () => {
    expect(check(catalogCall)).toEqual([]);
  });
});

const cases: Record<string, (c: Catalog) => void> = {
  'DESIGN-019': (c) => widget(c, 'W06').data.push('Novel.title'),
  'DESIGN-029': (c) => (c.screens.find((s) => s.screen === 'S04')!.parts = ['W05']),
  // The shelf header loses the slot that shows the page's title.
  'DESIGN-030': (c) => (widget(c, 'W05').slots = []),
  'DESIGN-040': (c) => {
    const detail = widget(c, 'W08');
    detail.flowSteps = detail.flowSteps.filter((id) => id !== 'F05.S02');
  },
  'DESIGN-041': (c) => (widget(c, 'W03').layout.parts[0]!.minWidthPx = 900),
  // The shelf header, which adds a book, also on the book page.
  'DESIGN-046': (c) => c.screens.find((s) => s.screen === 'S06')!.parts.push('W05'),
};

describe('the catalog rules', () => {
  it('pairs each rule with one case', () => {
    expect([...Object.keys(cases), 'DESIGN-031'].sort()).toEqual(catalogRules.map((r) => r.id).sort());
  });

  it.each(Object.keys(cases))('%s fails its case', (rule) => {
    expect(rules(check(changed(cases[rule]!)))).toContain(rule);
  });

  it('DESIGN-031 wants an extra state of a screen on one of its widgets', () => {
    const extra = structuredClone(plan);
    extra.screens.find((s) => s.id === 'S06')!.states.push('denied');
    expect(check(catalogCall, extra).map((i) => [i.rule, i.at])).toEqual([['DESIGN-031', 'S06']]);
  });

  it('DESIGN-029 wants well-formed widget ids, every widget on a screen, and only declared components', () => {
    const at = (change: (c: Catalog) => void) =>
      check(changed(change))
        .filter((i) => i.rule === 'DESIGN-029')
        .map((i) => i.at);
    expect(at((c) => (widget(c, 'W11').id = 'Actions'))).toContain('Actions');
    expect(at((c) => widget(c, 'W08').newComponents.push('CoverArt'))).toEqual(['W08']);
    expect(
      at((c) => {
        for (const s of c.screens) s.parts = s.parts.filter((p) => p !== 'W09');
        widget(c, 'W09').newComponents = [];
      }),
    ).toEqual(['W09', 'TitleCover']);
  });

  it('DESIGN-040 gives a frame only the steps of a framed page', () => {
    const at = (change: (c: Catalog) => void) =>
      check(changed(change)).map((i) => [i.rule, i.at]);
    expect(at((c) => (c.screens.find((s) => s.screen === 'S05')!.frameSteps = ['F03.S02']))).toEqual([['DESIGN-040', 'S05']]);
    expect(at((c) => (c.screens.find((s) => s.screen === 'S04')!.frameSteps = ['F05.S02']))).toEqual([['DESIGN-040', 'S04']]);
  });

  it('DESIGN-041 wants one width range for each declared component, and no other', () => {
    const at = (change: (c: Catalog) => void) =>
      check(changed(change)).map((i) => [i.rule, i.at]);
    expect(at((c) => (c.components = []))).toEqual([['DESIGN-041', 'TitleCover']]);
    expect(at((c) => c.components.push({ name: 'CoverArt', minWidthPx: 0, maxWidthPx: 0 }))).toEqual([['DESIGN-041', 'CoverArt']]);
    expect(at((c) => (c.components[0]!.maxWidthPx = 120))).toEqual([['DESIGN-041', 'TitleCover']]);
  });

  it('DESIGN-041 wants each slot inside its widget', () => {
    const issues = check(
      changed((c) => {
        const form = widget(c, 'W03');
        form.maxWidthPx = 480;
        form.slots.push({ name: 'body', kind: 'parts', holds: 'the fields', minWidthPx: 520, maxWidthPx: 0 });
      }),
    );
    expect(issues.map((i) => [i.rule, i.at])).toEqual([['DESIGN-041', 'W03']]);
  });
});
