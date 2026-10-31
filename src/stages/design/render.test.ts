import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Inventory } from '../../ds/inventory';
import { Flows, Scope } from '../flows/schema';
import { renderDesign } from './render';
import { Brief, makeScreensSchema, type Screens } from './schema';
import { makeThemeSchema } from './schema-theme';
import { buildTheme } from './theme';

const read = (path: string) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as unknown;
const inventory = read('../../ds/__fixtures__/inventory.json') as Inventory;
const screens = makeScreensSchema(inventory).Screens.parse(
  read('./__fixtures__/reading-list.screens.json'),
) as Screens;
const brief = Brief.parse(
  read('./__fixtures__/reading-list.brief.json'),
);
const flows = Flows.parse(
  read('../flows/__fixtures__/reading-list.flows.json'),
);
const scope = Scope.parse(
  read('../flows/__fixtures__/reading-list.scope.json'),
);
const theme = buildTheme(
  brief,
  makeThemeSchema(brief, inventory).parse(
    read('./__fixtures__/reading-list.theme.json'),
  ),
);
const markdown = renderDesign(brief, theme, screens, flows, scope);

describe('renderDesign', () => {
  it('renders the reading-list design', () => {
    expect(markdown).toMatchSnapshot();
  });

  it('puts pages before dialogs, every section and every node once', () => {
    const headings = [...markdown.matchAll(/^## (S\d{2}) /gm)].map((m) => m[1]);
    expect(headings).toEqual(['S01', 'S02', 'S03', 'S04', 'S06', 'S05', 'S07']);
    for (const section of screens.sections)
      expect(
        markdown.match(new RegExp(`^### ${section.id} `, 'gm')),
      ).toHaveLength(1);
    for (const node of screens.nodes)
      expect(
        markdown.match(new RegExp(`\`${node.id}\`$`, 'gm')),
        node.id,
      ).toHaveLength(1);
  });

  it('shows the palette with its contrast, the fonts and the new component', () => {
    expect(markdown).toMatch(
      /^\| fg \| `#[0-9A-F]{6}` \| [\d.]+:1 on bg, [\d.]+:1 on hoverBg \|$/m,
    );
    expect(markdown).toContain('### shelf, dark');
    expect(markdown).toContain(
      'Fonts: Inter for text, Playfair Display for headings, JetBrains Mono for code.',
    );
    expect(markdown).toContain('### TitleCover');
    expect(markdown).toContain(
      '[Button sm · primary-action] Add book → S05 (F03.S01) (over the defaults: The page header keeps its actions compact, the same size as Sign out.) `S04.n06`',
    );
    expect(markdown).toContain('dialog of S04');
  });

  it('shows the page colors, both layouts and the component defaults', () => {
    expect(markdown).toMatch(
      /^\| pageFgMuted \| `#[0-9A-F]{6}` \| [\d.]+:1 on pageBg, [\d.]+:1 on frameBg \|$/m,
    );
    expect(markdown).toContain(
      '- app: header first; container fluid center, padding 6, section gap 6; header sticky, divider.',
    );
    expect(markdown).toContain(
      '- marketing: header first; container fluid center, padding 6, section gap 6, full-bleed sections; header scrolls, over the hero, none.',
    );
    expect(markdown).toContain('Button variant default, size md, look ""');
    const inset = structuredClone(theme);
    inset.layouts.app.main.separation = 'divider';
    expect(renderDesign(brief, inset, screens, flows, scope)).toContain(
      '- app: header first; container fluid center, padding 6, section gap 6, main divider; header sticky, divider.',
    );
  });
});
