import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Issue } from '../../core/issues';
import type { Flows, Scope } from '../flows/schema';
import { builds, designs, frames, ia, inventory } from './__fixtures__/widgets';
import { layoutShells } from './resolve';
import { Brief } from './schema';
import { makeThemeSchema } from './schema-theme';
import type { Build, FrameBuild, WidgetIa } from './schema-widgets';
import { buildTheme } from './theme';
import type { DesignContext } from './validate';
import {
  validateComponent,
  validateFrame,
  validateWidget,
  validateWidgetIa,
} from './validate-widgets';

const read = (file: string): unknown =>
  JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'));
const brief = Brief.parse(read('./__fixtures__/reading-list.brief.json'));
const theme = buildTheme(
  brief,
  makeThemeSchema(brief, inventory).parse(
    read('./__fixtures__/reading-list.theme.json'),
  ),
);
const ctx: DesignContext = {
  scope: read('../flows/__fixtures__/reading-list.scope.json') as Scope,
  flows: read('../flows/__fixtures__/reading-list.flows.json') as Flows,
  inventory,
  shells: layoutShells(theme.layouts),
  defaults: theme.defaults,
};

const rules = (issues: Issue[]) => [...new Set(issues.map((i) => i.rule))];
const copyOf = (text: string) => ia.copy.find((c) => c.text === text)?.id ?? '';
const build = (widget: string) => {
  const found = builds.find((b) => b.widget === widget);
  if (!found) throw new Error(`no build for ${widget}`);
  return structuredClone(found);
};
function changed(change: (copy: WidgetIa) => void): WidgetIa {
  const copy = structuredClone(ia);
  change(copy);
  return copy;
}
const widgetIssues = (b: Build, on = ia) => validateWidget(b, on, ctx, theme);
const frameIssues = (f: FrameBuild) => validateFrame(f, ia, ctx, theme);
const [cover] = ia.newComponents;
const coverDesign = designs.get(cover?.name ?? '');
if (!cover || !coverDesign) throw new Error('the fixture declares TitleCover');

describe('the reading-list widget design', () => {
  it('passes the IA, every widget, both frames and the component, warnings included', () => {
    expect(validateWidgetIa(ia, ctx)).toEqual([]);
    for (const b of builds) expect(widgetIssues(b), b.widget).toEqual([]);
    for (const f of frames) expect(frameIssues(f), f.screen).toEqual([]);
    expect(
      validateComponent({ ...cover, ...coverDesign, usedOn: ['S06'] }, ia, ctx),
    ).toEqual([]);
  });
});

const iaCases: [string, string, (x: WidgetIa) => void][] = [
  [
    'DESIGN-028',
    'a navigation label that is not its page title',
    (x: WidgetIa) => (x.navigation.items[0]!.label = copyOf('Shelf')),
  ],
  [
    'DESIGN-028',
    'a string in the deck twice',
    (x: WidgetIa) =>
      x.copy.push({ id: 'C900', kind: 'action', text: 'Add book' }),
  ],
  [
    'DESIGN-029',
    'a main-side page with two main placements',
    (x: WidgetIa) =>
      (x.placements.find((p) => p.id === 'S06.sec2')!.area = 'main'),
  ],
  [
    'DESIGN-029',
    'a widget placed nowhere',
    (x: WidgetIa) =>
      void (x.placements = x.placements.filter((p) => p.id !== 'S04.sec4')),
  ],
  [
    'DESIGN-030',
    'a level skipped after the H1',
    (x: WidgetIa) =>
      (x.placements.find((p) => p.id === 'S06.sec2')!.headingLevel = 3),
  ],
  [
    'DESIGN-030',
    'a page without its level-1 widget',
    (x: WidgetIa) =>
      (x.placements.find((p) => p.id === 'S04.sec1')!.headingLevel = 2),
  ],
  [
    'DESIGN-031',
    'a list without its empty state',
    (x: WidgetIa) => (x.widgets.find((w) => w.id === 'W08')!.states = []),
  ],
  [
    'DESIGN-031',
    'a field no widget takes',
    (x: WidgetIa) =>
      (x.widgets.find((w) => w.id === 'W09')!.fields = ['FD03', 'FD04']),
  ],
  [
    'DESIGN-018',
    'sign in behind sign in',
    (x: WidgetIa) =>
      (x.screens.find((s) => s.id === 'S02')!.access = 'signedIn'),
  ],
  [
    'DESIGN-004',
    'a declaration without its reason',
    (x: WidgetIa) => (x.newComponents[0]!.whyNotExisting = ''),
  ],
];

describe('the IA rules', () => {
  it.each(iaCases)('%s fails %s', (rule, _what, change) => {
    expect(rules(validateWidgetIa(changed(change), ctx))).toContain(rule);
  });
});

describe('a widget call', () => {
  it('fails DESIGN-028 for a literal string, a string the deck has, and a given string not shown', () => {
    const literal = build('W05');
    literal.nodes[5]!.text = 'Add book';
    expect(widgetIssues(literal).map((i) => [i.rule, i.at])).toContainEqual([
      'DESIGN-028',
      'W05.n06',
    ]);
    const again = build('W05');
    again.copy = [{ id: 'W05.c1', kind: 'action', text: 'Add book' }];
    expect(rules(widgetIssues(again))).toContain('DESIGN-028');
    const dropped = build('W05');
    dropped.nodes = dropped.nodes.filter((n) => n.id !== 'W05.n03');
    expect(
      widgetIssues(dropped)
        .map((i) => i.message)
        .join('\n'),
    ).toContain(
      `must show ${copyOf('Books you mean to read, are reading and have read.')}`,
    );
  });

  it('fails DESIGN-030 for a top heading at the wrong level', () => {
    const b = build('W05');
    b.nodes[1]!.headingLevel = 2;
    expect(widgetIssues(b).map((i) => [i.rule, i.at])).toContainEqual([
      'DESIGN-030',
      'W05.n02',
    ]);
  });

  it('fails DESIGN-032 for a field without its input and a step the widget does not serve', () => {
    const b = build('W09');
    b.nodes = b.nodes.filter((n) => n.field !== 'FD05');
    b.nodes[0]!.flowSteps.push('F04.S01');
    expect(
      widgetIssues(b)
        .filter((i) => i.rule === 'DESIGN-032')
        .map((i) => i.at),
    ).toEqual(['W09', 'W09.n01']);
  });

  it('fails DESIGN-033 for a state the IA did not give the widget', () => {
    const b = build('W11');
    b.nodes[0]!.states = ['default', 'error'];
    expect(widgetIssues(b).map((i) => [i.rule, i.at])).toContainEqual([
      'DESIGN-033',
      'W11.n01',
    ]);
  });

  it('runs the node rules on the widget alone, without the screen-wide states and headings', () => {
    const b = build('W10');
    b.nodes[1]!.role = 'primary-action';
    b.nodes[0]!.role = 'primary-action';
    expect(rules(widgetIssues(b))).toEqual(['DESIGN-012']);
  });

  it('solves the widget alone and keeps the layout issues inside it', () => {
    const b = build('W10');
    b.layout.gap = '6';
    expect(widgetIssues(b).map((i) => [i.rule, i.at])).toEqual([
      ['LAYOUT-011', 'W10.n02'],
    ]);
  });

  it('fails a build for a widget the IA does not have', () => {
    expect(
      widgetIssues({ ...build('W10'), widget: 'W99' }).map((i) => i.rule),
    ).toEqual(['DESIGN-029']);
  });
});

describe('a frame call', () => {
  it("fails DESIGN-028 when the link drawing a navigation item does not say the item's label", () => {
    const f = structuredClone(frames[0]!);
    f.nodes[1]!.text = copyOf('Shelf');
    expect(frameIssues(f).map((i) => [i.rule, i.at])).toEqual([
      ['DESIGN-028', 'SH1.n02'],
    ]);
  });
});

describe('a component call', () => {
  it('fails DESIGN-004 for a design without states', () => {
    const issues = validateComponent(
      { ...cover, ...coverDesign, states: [], usedOn: ['S06'] },
      ia,
      ctx,
    );
    expect(rules(issues)).toEqual(['DESIGN-004']);
  });
});
