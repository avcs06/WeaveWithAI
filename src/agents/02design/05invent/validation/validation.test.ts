import { describe, expect, it } from 'vitest';
import type { Issue } from '../../../../core/issues';
import { catalog, ctx, designs, plan, theme } from '../../__fixtures__/chain';
import { kindOf } from '../../calls';
import type { ComponentDesign } from '../schema';
import { validateComponent } from './validation';

const rules = (issues: Issue[]) => [...new Set(issues.map((i) => i.rule))];
const cover = designs.get('TitleCover');
const range = catalog.components.find((c) => c.name === 'TitleCover');
if (!cover || !range) throw new Error('the fixture declares TitleCover');
const check = (design: ComponentDesign, widths = range) =>
  validateComponent('TitleCover', design, widths, 'app', ctx, theme);

function changed(change: (copy: ComponentDesign) => void): ComponentDesign {
  const copy = structuredClone(cover!);
  change(copy);
  return copy;
}

describe('an invent call', () => {
  it("passes TitleCover's design with no mandatory issue", () => {
    expect(check(cover).filter((i) => i.severity === 'mandatory')).toEqual([]);
  });

  it('DESIGN-044 wants each slot the catalog gives the component drawn as one node naming it', () => {
    const slotted = { ...range, slots: [{ name: 'body', kind: 'parts' as const, holds: 'what sits under the cover', minWidthPx: 0, maxWidthPx: 0 }] };
    const at = (design: ComponentDesign) =>
      check(design, slotted).filter((i) => i.rule === 'DESIGN-044').map((i) => i.at);
    expect(at(cover)).toEqual(['TitleCover']);
    const drawn = changed((d) => {
      d.nodes.push({ ...structuredClone(d.nodes[0]!), id: 'TitleCover.n90', parent: '', order: 90, what: 'the body slot', role: 'container', slot: 'body', text: '', layout: d.layout });
    });
    expect(at(drawn)).toEqual([]);
  });

  it("fails DESIGN-001 for a node id that is not the component's", () => {
    expect(rules(check(changed((d) => (d.nodes[0]!.id = 'Cover-1'))))).toContain('DESIGN-001');
  });

  it('draws a component held only in widgets for the kind of the screens those widgets are on', () => {
    expect(kindOf('TitleCover', plan, catalog)).toBe('app');
    const marketing = structuredClone(plan);
    marketing.screens.find((s) => s.id === 'S06')!.kind = 'marketing';
    expect(kindOf('TitleCover', marketing, catalog)).toBe('marketing');
  });

  it("fails DESIGN-041 for a root outside the catalog's width range", () => {
    expect(check(changed((d) => (d.box.widthPx = 200))).map((i) => [i.rule, i.at])).toContainEqual(['DESIGN-041', 'TitleCover']);
  });

  it('fails DESIGN-042 for a shape sized by content it does not have', () => {
    const ring = changed((d) =>
      d.nodes.push({ ...structuredClone(d.nodes[1]!), id: 'TitleCover.n03', order: 3, role: 'shape', text: '' }),
    );
    expect(check(ring).map((i) => [i.rule, i.at])).toContainEqual(['DESIGN-042', 'TitleCover.n03']);
  });

  it("stands as one node holding its nodes, so its padding is its own and not a section's", () => {
    // 16 of padding would be too little for a padded section (LAYOUT-014).
    expect(cover.box.padding).toBe('4');
    expect(rules(check(cover))).not.toContain('LAYOUT-014');
  });
});
