import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DIALOG_GAP, SIDE_WIDTH_PX } from '../../config/design';
import type { Flows, Scope } from '../flows/schema';
import {
  builds,
  designs,
  frames,
  ia,
  inventory,
  screens,
} from './__fixtures__/widgets';
import { assembleScreens, legacyIa } from './assemble';
import { skeleton } from './layout';
import { Brief, type Screens } from './schema';
import { makeThemeSchema } from './schema-theme';
import { buildTheme } from './theme';
import type { DesignContext } from './validate';
import { validateDesign } from './validate-widgets';

const read = (file: string): unknown =>
  JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'));
const brief = Brief.parse(read('./__fixtures__/reading-list.brief.json'));
const theme = buildTheme(
  brief,
  makeThemeSchema(brief, inventory).parse(
    read('./__fixtures__/reading-list.theme.json'),
  ),
);
const { screens: assembled, origin } = assembleScreens(
  ia,
  designs,
  builds,
  frames,
  theme,
);

const ctx: DesignContext = {
  scope: read('../flows/__fixtures__/reading-list.scope.json') as Scope,
  flows: read('../flows/__fixtures__/reading-list.flows.json') as Flows,
  inventory,
  shells: assembled.shells,
  defaults: theme.defaults,
};

const textsOf = (s: Screens, screen: string) =>
  s.nodes
    .filter((node) => node.id.startsWith(`${screen}.`))
    .map((node) => [node.text, node.label].join('|'))
    .sort();

describe('assembleScreens', () => {
  it('rebuilds the reading-list design from its widgets: the same screens, sections and text', () => {
    expect(
      assembled.screens.map((s) => [s.id, s.shell, s.flowSteps.length > 0]),
    ).toEqual(
      screens.screens.map((s) => [s.id, s.shell, s.flowSteps.length > 0]),
    );
    expect(assembled.sections.map((s) => [s.id, s.kind, s.surface])).toEqual(
      screens.sections.map((s) => [s.id, s.kind, s.surface]),
    );
    expect(assembled.nodes).toHaveLength(screens.nodes.length);
    for (const { id } of screens.screens)
      expect(textsOf(assembled, id), id).toEqual(textsOf(screens, id));
    // The app bar's link to the shelf says the navigation item's label, the page's title.
    expect(textsOf(assembled, 'SH1')).toEqual(['Shelf|', 'Your shelf|']);
    expect(textsOf(assembled, 'SH2')).toEqual(textsOf(screens, 'SH2'));
    expect(assembled.newComponents).toEqual(screens.newComponents);
  });

  it('passes every design rule and every layout rule, warnings included', () => {
    expect(
      validateDesign(assembled, skeleton(assembled, inventory), ctx),
    ).toEqual([]);
  });

  it('renumbers the nodes to their screen in reading order and keeps the widget node each came from', () => {
    const add = assembled.nodes.find((node) => node.text === 'Add book');
    expect(add).toMatchObject({
      id: 'S04.n06',
      section: 'S04.sec1',
      parent: 'S04.n04',
    });
    expect(origin.get('S04.n06')).toBe('W05.n06');
    // The shelf's search comes after the six nodes of its page header.
    expect(origin.get('S04.n07')).toBe('W06.n01');
    expect(
      assembled.nodes
        .filter((node) => node.id.startsWith('SH1.'))
        .map((node) => node.id),
    ).toEqual(['SH1.n01', 'SH1.n02']);
  });

  it("sizes a heading by its level and the screen's kind, and shows a value's sample", () => {
    const heading = (text: string) =>
      assembled.nodes.find(
        (node) => node.text === text && node.headingLevel > 0,
      );
    expect(heading('Your shelf')).toMatchObject({
      headingLevel: 1,
      typeScale: 'title',
    });
    expect(heading('Shelf')).toMatchObject({
      headingLevel: 2,
      typeScale: 'heading',
    });
    expect(heading('Keep every book you mean to read')).toMatchObject({
      typeScale: 'display',
    });
    expect(heading('Find it again')).toMatchObject({
      headingLevel: 3,
      typeScale: 'heading',
    });
    expect(heading('The Left Hand of Darkness')).toMatchObject({
      data: ['Book.title'],
    });
  });

  it("fills a copy's slot with the node's sample and keeps an unknown copy id for the copy rules", () => {
    const [first, ...rest] = builds;
    if (!first) throw new Error('no builds');
    const slot = {
      id: 'C900',
      kind: 'text' as const,
      text: 'Remove “{Book.title}” for good?',
    };
    const node = {
      ...first.nodes[0]!,
      role: 'text' as const,
      text: 'C900',
      sample: 'Dune',
      label: 'C999',
    };
    const { screens: out } = assembleScreens(
      { ...ia, copy: [...ia.copy, slot] },
      designs,
      [{ ...first, nodes: [node, ...first.nodes.slice(1)] }, ...rest],
      frames,
      theme,
    );
    expect(out.nodes.find((n) => n.id === 'S01.n01')).toMatchObject({
      text: 'Remove “Dune” for good?',
      label: 'C999',
    });
  });

  it('lays a main-side page out as a row with a fixed side panel, a page with its layout spacing and a dialog with its own', () => {
    const screen = (id: string) => assembled.screens.find((s) => s.id === id);
    expect(screen('S06')?.layout).toMatchObject({
      direction: 'row',
      gap: theme.layouts.app.main.sectionGap,
    });
    expect(
      assembled.sections.find((s) => s.id === 'S06.sec2')?.box,
    ).toMatchObject({ width: 'fixed', widthPx: SIDE_WIDTH_PX });
    expect(screen('S04')?.layout).toMatchObject({
      direction: 'column',
      padding: theme.layouts.app.main.padding,
    });
    expect(screen('S05')?.layout).toMatchObject({
      direction: 'column',
      gap: DIALOG_GAP,
      padding: '0',
    });
  });
});

describe('legacyIa', () => {
  it('turns placements into sections and lists a declared component where its widgets are placed, before any build', () => {
    const legacy = legacyIa(ia);
    expect(legacy.sections).toHaveLength(ia.placements.length);
    expect(legacy.newComponents.map((c) => [c.name, c.usedOn])).toEqual([
      ['TitleCover', ['S06']],
    ]);
    expect(legacy.navigation.items.map((item) => item.label)).toEqual([
      'Your shelf',
      'Sign in',
    ]);
  });
});
