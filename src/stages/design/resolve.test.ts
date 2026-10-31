import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Inventory } from '../../ds/inventory';
import { layoutShells, resolveScreens, withDefaults } from './resolve';
import { Brief, type DesignNode, type Ia, makeScreensSchema } from './schema';
import { makeThemeSchema } from './schema-theme';
import { buildTheme } from './theme';

const read = (path: string) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as unknown;
const inventory = read('../../ds/__fixtures__/inventory.json') as Inventory;
const schemas = makeScreensSchema(inventory);
const screens = schemas.Screens.parse(
  read('./__fixtures__/reading-list.screens.json'),
);
const brief = Brief.parse(read('./__fixtures__/reading-list.brief.json'));
const theme = buildTheme(
  brief,
  makeThemeSchema(brief, inventory).parse(
    read('./__fixtures__/reading-list.theme.json'),
  ),
);

/** The IA as the call writes it: no shells, a page's gap and padding left to its layout. */
const ia: Ia = schemas.Ia.parse({
  ...screens,
  screens: screens.screens.map(({ shell: _, ...screen }) =>
    screen.type === 'page'
      ? { ...screen, layout: { ...screen.layout, gap: '', padding: '' } }
      : screen,
  ),
});

describe('resolveScreens', () => {
  it("makes the fixture's shells from the theme's layouts", () => {
    expect(layoutShells(theme.layouts)).toEqual(screens.shells);
  });

  it('gives each framed page its kind\'s shell and each page its layout\'s gap and padding', () => {
    const resolved = resolveScreens(ia, screens.nodes, theme);
    expect(resolved.screens).toEqual(screens.screens);
    expect(resolved.containers).toEqual(screens.containers);
    expect(resolved.shells).toEqual(screens.shells);
  });

  it('leaves a page unframed when its layout has no frame', () => {
    const bare = structuredClone(theme);
    bare.layouts.app.header.needed = false;
    const resolved = resolveScreens(ia, screens.nodes, bare);
    expect(resolved.shells.map((shell) => shell.id)).toEqual(['SH2']);
    expect(
      resolved.screens.filter((s) => s.shell).map((s) => [s.id, s.shell]),
    ).toEqual([['S01', 'SH2']]);
  });
});

describe('withDefaults', () => {
  const button = (rest: Partial<DesignNode>) => ({
    ...screens.nodes.find((node) => node.component === 'Button')!,
    ...rest,
  });
  const ghost = structuredClone(theme);
  ghost.defaults.Button = { ...ghost.defaults.Button!, size: 'md', look: 'ghost' };

  it('fills an empty size or look with the default, keeps a chosen one, and keeps base for the coding stage', () => {
    const [empty, chosen, base] = withDefaults(
      [
        button({ size: '', look: '' }),
        button({ size: 'sm', look: 'rounded' }),
        button({ look: 'base' }),
      ],
      ghost,
    );
    expect([empty?.size, empty?.look]).toEqual(['md', 'ghost']);
    expect([chosen?.size, chosen?.look]).toEqual(['sm', 'rounded']);
    expect(base?.look).toBe('base');
  });

  it('leaves nodes that are not design-system components alone', () => {
    const text = screens.nodes.find((node) => node.component === 'none')!;
    expect(withDefaults([text], ghost)).toEqual([text]);
  });
});
