import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  builds,
  designs,
  frames,
  ia,
  inventory,
} from '../../__fixtures__/widgets';
import type { Issue } from '../../../../core/issues';
import type { Scope } from '../../../01flows/01scope/schema';
import type { Flows } from '../../../01flows/schema';
import { Brief } from '../../01brief/schema';
import { buildTheme } from '../../02theme/build';
import { makeThemeSchema } from '../../02theme/schema';
import { layoutShells } from '../../02theme/shells';
import { validateComponent } from '../../06invent/validation/validation';
import type { Build } from '../../07draw/schema';
import { validateWidget } from '../../07draw/validation/validation';
import type { FrameBuild } from '../../08frame/schema';
import { validateFrame } from '../../08frame/validation/validation';
import type { DesignContext } from '../../rules/helpers';
import type { WidgetIa } from '../schema';
import { validateWidgetIa } from './validation';

const read = (file: string): unknown =>
  JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'));

const brief = Brief.parse(read('../../__fixtures__/reading-list.brief.json'));

const theme = buildTheme(
  brief,
  makeThemeSchema(brief, inventory).parse(
    read('../../__fixtures__/reading-list.theme.json'),
  ),
);

const ctx: DesignContext = {
  scope: read('../../../01flows/__fixtures__/reading-list.scope.json') as Scope,
  flows: read('../../../01flows/__fixtures__/reading-list.flows.json') as Flows,
  inventory,
  shells: layoutShells(theme.layouts),
  defaults: theme.defaults,
};

const rules = (issues: Issue[]) => [...new Set(issues.map((i) => i.rule))];

const copyOf = (text: string) => ia.copy.find((c) => c.text === text)?.id ?? '';

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
