import { describe, expect, it } from 'vitest';
import type { Issue } from '../../../../core/issues';
import { builds, catalog, ctx, plan, theme } from '../../__fixtures__/chain';
import { planAsIa } from '../../02architect/process';
import { kindOf } from '../../calls';
import type { Build } from '../schema';
import { validateDrawn, validateWidget, widgetRules } from './validation';

const rules = (issues: Issue[]) => [...new Set(issues.map((i) => i.rule))];
const widgets = new Map(catalog.widgets.map((w) => [w.id, w]));
const { newComponents } = planAsIa(plan);
const build = (id: string): Build => {
  const found = builds.find((b) => b.widget === id);
  if (!found) throw new Error(`no build for ${id}`);
  return structuredClone(found);
};
const check = (b: Build, components = newComponents) =>
  validateWidget(b, widgets.get(b.widget)!, kindOf(b.widget, plan, catalog), components, ctx, theme);
const drawn = (b: Build, id: string) =>
  validateDrawn(b, widgets.get(id)!, kindOf(id, plan, catalog), newComponents, ctx, theme);

describe('the reading-list widgets', () => {
  it('pass every draw check, warnings included', () => {
    for (const b of builds) expect(drawn(b, b.widget), b.widget).toEqual([]);
  });
});

describe('a draw call', () => {
  it('pairs each widget rule with a test', () => {
    expect(widgetRules.map((r) => r.id)).toEqual(['DESIGN-030', 'DESIGN-032', 'DESIGN-033', 'DESIGN-044', 'DESIGN-048']);
  });

  it("fails DESIGN-048 when a confirmation's own text says two sentences or names no record, and leaves other text alone", () => {
    const confirm = build('W10');
    const text = confirm.nodes.find((n) => n.role === 'text')!;
    const at = (b: Build) => check(b).filter((i) => i.rule === 'DESIGN-048').map((i) => i.at);
    expect(at(confirm)).toEqual([]);
    text.sample = 'This removes the book from your shelf. It cannot be undone.';
    text.data = [];
    expect(at(confirm)).toEqual([text.id, 'W10']);
    const welcome = build('W03');
    welcome.nodes.find((n) => n.id === 'W03.n03')!.text = 'Welcome back. Your shelf is waiting.';
    expect(at(welcome)).toEqual([]);
  });

  it("fails DESIGN-030 when the top heading is not level 1, or a widget without one has a heading", () => {
    const top = build('W05');
    top.nodes[1]!.headingLevel = 2;
    expect(check(top).map((i) => [i.rule, i.at])).toContainEqual(['DESIGN-030', 'W05']);
    const actions = build('W11');
    Object.assign(actions.nodes[0]!, { role: 'heading', headingLevel: 1, typeScale: 'heading' });
    expect(check(actions).map((i) => [i.rule, i.at])).toContainEqual(['DESIGN-030', 'W11.n01']);
  });

  it('fails DESIGN-032 for a field without its input and a step the widget does not serve', () => {
    const b = build('W07');
    b.nodes = b.nodes.filter((n) => n.field !== 'FD05');
    b.nodes[0]!.flowSteps.push('F04.S01');
    expect(
      check(b)
        .filter((i) => i.rule === 'DESIGN-032')
        .map((i) => i.at),
    ).toEqual(['W07', 'W07.n01']);
  });

  it("DESIGN-033 flags a form's result line, which is a toast", () => {
    const b = build('W07');
    b.nodes.push({ ...structuredClone(b.nodes[0]!), id: 'W07.n09', order: 9, role: 'feedback', component: 'none', field: '', text: 'The book could not be saved.', states: ['error'], flowSteps: [] });
    expect(check(b).map((i) => [i.rule, i.at])).toContainEqual(['DESIGN-033', 'W07.n09']);
  });

  it('fails DESIGN-033 for a state the catalog did not give the widget', () => {
    const b = build('W08');
    b.nodes[0]!.states = ['default', 'error'];
    expect(check(b).map((i) => [i.rule, i.at])).toContainEqual(['DESIGN-033', 'W08.n01']);
  });

  it('fails DESIGN-044 for a slot drawn with words or not at all, and a component the widget does not hold', () => {
    const at = (b: Build) => check(b).filter((i) => i.rule === 'DESIGN-044').map((i) => i.at);
    const worded = build('W05');
    worded.nodes[1]!.text = 'Your shelf';
    expect(at(worded)).toEqual(['W05.n02']);
    const unslotted = build('W05');
    unslotted.nodes[1]!.slot = '';
    expect(at(unslotted)).toEqual(['W05']);
    const extra = build('W08');
    extra.nodes[0]!.newComponent = 'TitleCover';
    expect(at(extra)).toEqual(['W08.n01']);
    const missing = build('W09');
    missing.nodes = missing.nodes.filter((n) => n.newComponent !== 'TitleCover');
    expect(at(missing)).toContain('W09');
  });

  it('fails DESIGN-042 for a shape sized by content', () => {
    const b = build('W08');
    Object.assign(b.nodes[0]!, { role: 'shape', component: 'none', text: '' });
    b.nodes[0]!.box = { ...b.nodes[0]!.box, width: 'content' };
    expect(check(b).map((i) => [i.rule, i.at])).toContainEqual(['DESIGN-042', 'W08.n01']);
  });

  it('runs the node rules on the widget alone, among the declared components', () => {
    const b = build('W07');
    b.nodes.find((n) => n.role === 'secondary-action')!.role = 'primary-action';
    expect(rules(check(b))).toEqual(['DESIGN-012']);
    expect(check(build('W09'))).toEqual([]);
    expect(rules(check(build('W09'), []))).toContain('DESIGN-003');
  });

  it('solves the widget alone and keeps the layout issues inside it', () => {
    const b = build('W07');
    b.nodes.find((n) => n.what === 'the actions, at the end')!.layout!.gap = '3';
    expect(check(b).map((i) => [i.rule, i.at])).toEqual([['LAYOUT-011', 'W07.n06']]);
  });

  it('fails DESIGN-029 for a build of another widget than the one it was given', () => {
    expect(drawn({ ...build('W11'), widget: 'W99' }, 'W11').map((i) => [i.rule, i.at])).toEqual([['DESIGN-029', 'W99']]);
  });
});
