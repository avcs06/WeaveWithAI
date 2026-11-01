import { describe, expect, it } from 'vitest';
import type { Issue } from '../../../../core/issues';
import { ctx, flows, planCall, scope, theme } from '../../__fixtures__/chain';
import { processPlan } from '../process';
import type { Plan } from '../schema';
import { planIaRules, planRules, validatePlan } from './validation';

const rules = (issues: Issue[]) => [...new Set(issues.map((i) => i.rule))];

const check = (plan: Plan) =>
  validatePlan(processPlan(plan, flows, scope), theme.layouts, ctx);

function changed(change: (copy: Plan) => void): Plan {
  const copy = structuredClone(planCall);
  change(copy);
  return copy;
}

const screen = (plan: Plan, id: string) => {
  const found = plan.screens.find((s) => s.id === id);
  if (!found) throw new Error(`the plan has no ${id}`);
  return found;
};

describe('the reading-list plan', () => {
  it('passes every architect rule after its processing step, warnings included', () => {
    expect(check(planCall)).toEqual([]);
  });
});

const cases: Record<string, (p: Plan) => void> = {
  'DESIGN-001': (p) => (screen(p, 'S07').id = 'S7'),
  'DESIGN-004': (p) => (p.newComponents[0]!.whyNotExisting = ''),
  'DESIGN-005': (p) => (p.newComponents[0]!.name = 'Button'),
  'DESIGN-009': (p) => {
    const book = screen(p, 'S06');
    book.flowSteps = book.flowSteps.filter((id) => id !== 'F05.S02');
  },
  'DESIGN-017': (p) => {
    for (const s of p.screens) s.entry = false;
  },
  'DESIGN-021': (p) =>
    p.screens.push({ ...screen(p, 'S06'), id: 'S08', route: '/settings', flowSteps: [], states: [] }),
  'DESIGN-023': (p) => (screen(p, 'S05').framed = true),
  'DESIGN-036': (p) => (p.navigation[0]!.slot = 'sidebar.top'),
  'DESIGN-043': (p) => (screen(p, 'S06').route = ''),
  // Saving a book on the shelf page as well as on its dialog.
  'DESIGN-045': (p) => screen(p, 'S04').flowSteps.push('F03.S02'),
  // Confirming the deletion on the book page, not its dialog.
  'DESIGN-047': (p) => screen(p, 'S06').flowSteps.push('STD01.S01'),
};

describe('the architect rules', () => {
  it('pairs each rule with one case', () => {
    expect(Object.keys(cases).sort()).toEqual(
      [...new Set([...planRules, ...planIaRules].map((r) => r.id))].sort(),
    );
  });

  it.each(Object.keys(cases))('%s fails its case', (rule) => {
    expect(rules(check(changed(cases[rule]!)))).toContain(rule);
  });

  it('DESIGN-009 leaves out a step reported impossible, and its alternatives', () => {
    const reported = changed((p) => {
      const dialog = screen(p, 'S05');
      dialog.flowSteps = dialog.flowSteps.filter((id) => id !== 'F03.S02');
      p.impossibleSteps.push({ step: 'F03.S02', reason: 'no storage for books' });
    });
    expect(check(reported).filter((i) => i.rule === 'DESIGN-009')).toEqual([]);
    expect(
      check(changed((p) => (screen(p, 'S05').flowSteps = screen(p, 'S05').flowSteps.filter((id) => id !== 'F03.S02'))))
        .filter((i) => i.rule === 'DESIGN-009')
        .map((i) => i.at),
    ).toEqual(['F03.S02', 'F03.A01', 'F03.A02']);
  });

  it('DESIGN-036 wants a slot the layout fills, in a part it needs', () => {
    const at = (slot: string) =>
      check(changed((p) => (p.navigation[0]!.slot = slot))).map((i) => i.rule);
    expect(at('header.end')).toEqual([]);
    expect(at('header.center')).toEqual(['DESIGN-036']);
    expect(at('footer.end')).toEqual(['DESIGN-036']);
  });

  it("DESIGN-036 reads a public item's slot in the marketing layout, whose frame draws it", () => {
    const layouts = structuredClone(theme.layouts);
    layouts.marketing.header.end = '';
    const issues = validatePlan(processPlan(planCall, flows, scope), layouts, ctx);
    expect(issues.map((i) => [i.rule, i.at])).toEqual([['DESIGN-036', 'S02']]);
  });

  it('DESIGN-043 wants each page its own route and none on a dialog, and warns on a dialog of more than 6 fields', () => {
    const at = (change: (p: Plan) => void) =>
      check(changed(change))
        .filter((i) => i.rule === 'DESIGN-043')
        .map((i) => [i.at, i.severity]);
    expect(at((p) => (screen(p, 'S06').route = '/shelf'))).toEqual([['S06', 'mandatory']]);
    expect(at((p) => (screen(p, 'S05').route = '/add'))).toEqual([['S05', 'mandatory']]);
    // Signing up takes two fields and adding a book three: five in one dialog is fine, seven is not.
    const long = structuredClone(ctx);
    long.flows.forms.find((f) => f.id === 'FM01')!.fields.push('FD01', 'FD02', 'FD06', 'FD07');
    const issues = validatePlan(processPlan(planCall, long.flows, scope), theme.layouts, long);
    expect(issues.map((i) => [i.rule, i.at, i.severity])).toEqual([['DESIGN-043', 'S05', 'warning']]);
  });
});
