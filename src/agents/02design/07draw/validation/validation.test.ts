import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { builds, designs, ia, inventory } from '../../__fixtures__/widgets';
import type { Issue } from '../../../../core/issues';
import type { Scope } from '../../../01flows/01scope/schema';
import type { Flows } from '../../../01flows/schema';
import { Brief } from '../../01brief/schema';
import { buildTheme } from '../../02theme/build';
import { makeThemeSchema } from '../../02theme/schema';
import { layoutShells } from '../../02theme/shells';
import type { DesignContext } from '../../rules/helpers';
import type { Build } from '../schema';
import { validateWidget } from './validation';

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

const build = (widget: string) => {
  const found = builds.find((b) => b.widget === widget);
  if (!found) throw new Error(`no build for ${widget}`);
  return structuredClone(found);
};

const widgetIssues = (b: Build, on = ia) => validateWidget(b, on, ctx, theme);

const [cover] = ia.newComponents;

const coverDesign = designs.get(cover?.name ?? '');

if (!cover || !coverDesign) throw new Error('the fixture declares TitleCover');

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
