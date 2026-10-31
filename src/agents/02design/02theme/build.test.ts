import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Inventory } from '../../../ds/inventory';
import { Brief } from '../01brief/schema';
import { makeThemeSchema, type ThemeCall } from './schema';
import { buildTheme, Theme } from './build';
import { themeRules, validateTheme } from './validation/validation';

const read = (path: string) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as unknown;
const inventory = read('../../../ds/__fixtures__/inventory.json') as Inventory;
const brief = Brief.parse(read('../__fixtures__/reading-list.brief.json'));
const call = makeThemeSchema(brief, inventory).parse(
  read('../__fixtures__/reading-list.theme.json'),
);
const theme = buildTheme(brief, call);
const ids = (t: Theme) =>
  validateTheme(t, inventory).map((issue) => issue.rule);

describe('makeThemeSchema', () => {
  it('asks for the modes the brief names and a set per colored entity', () => {
    const light = { ...brief, colorScheme: 'light' as const };
    const { dark, ...lightOnly } = call.colors;
    expect(dark).toBeDefined();
    const schema = makeThemeSchema(light, inventory);
    expect(schema.safeParse({ ...call, colors: lightOnly }).success).toBe(true);
    const plain = { ...brief, entities: [] };
    expect(makeThemeSchema(plain, inventory).safeParse(call).success).toBe(
      true,
    );
    const noShelf = structuredClone(call);
    delete noShelf.colors.light!.entity.shelf;
    expect(
      makeThemeSchema(brief, inventory).safeParse(noShelf).success,
    ).toBe(false);
  });

  it("takes each component's defaults from its own values", () => {
    const schema = makeThemeSchema(brief, inventory);
    const button = (values: Record<string, string>) =>
      schema.safeParse({
        ...call,
        defaults: {
          ...call.defaults,
          Button: { ...call.defaults.Button!, ...values },
        },
      }).success;
    expect(button({ look: 'ghost' })).toBe(true);
    expect(button({ look: 'filled' })).toBe(false);
    expect(button({ size: 'xl' })).toBe(false);
  });
});

describe('buildTheme', () => {
  it('turns the brief and the call into a valid theme with the brief fonts, mono included', () => {
    expect(Theme.parse(theme)).toEqual(theme);
    expect(theme.modes).toEqual(['light', 'dark']);
    expect(theme.fonts).toEqual({
      ui: 'Inter',
      display: 'Playfair Display',
      mono: 'JetBrains Mono',
    });
    expect(theme.radius).toEqual({ surface: '8px', control: '6px' });
    expect(Object.keys(theme.colors.light!.entity)).toEqual(['shelf']);
    expect(theme.layouts).toEqual(call.layouts);
    expect(theme.defaults).toEqual(call.defaults);
    // Per mode: 4 page pairs and 4 quiet ones, 6 on the page and the frame for each of the theme and base sets, then 7 pairs for the theme, base and shelf sets.
    expect(theme.contrast).toHaveLength(2 * (4 + 4 + 2 * 6 + 3 * 7));
    expect(validateTheme(theme, inventory)).toEqual([]);
  });

  it('writes hex values in capitals and only the modes the brief names', () => {
    const lower = structuredClone(call);
    lower.colors.light!.theme.bg = '#e7f5f6';
    expect(buildTheme(brief, lower).colors.light!.theme.bg).toBe('#E7F5F6');
    const light = buildTheme({ ...brief, colorScheme: 'light' }, call);
    expect(light.modes).toEqual(['light']);
    expect(light.colors.dark).toBeUndefined();
    expect(light.contrast.every((row) => row.mode === 'light')).toBe(true);
  });

  it('stays the same for the same input', () => {
    expect(buildTheme(brief, call)).toEqual(theme);
    expect(theme).toMatchSnapshot();
  });
});

describe('theme rules', () => {
  const broken: Record<string, (t: Theme) => void> = {
    'THEME-001': (t) =>
      (t.colors.light!.theme.fgMuted = t.colors.light!.theme.bg),
    'THEME-002': (t) =>
      (t.colors.dark!.theme.border = t.colors.dark!.theme.bg),
    'THEME-004': (t) => (t.fonts.ui = 'Comic Sans MS'),
    'THEME-005': (t) => (t.colors.light!.entity.shelf!.fg = 'dark blue'),
    'THEME-006': (t) => {
      t.layouts.app.sidebar.needed = true;
      t.layouts.app.sidebar.top = 'the shelves';
    },
    'THEME-007': (t) => (t.layouts.app.main.sectionGap = '4'),
    'THEME-008': (t) => (t.defaults.Button!.size = 'icon-sm'),
    'THEME-009': (t) => (t.colors.light!.page.divider = t.colors.light!.page.pageBg),
  };

  it('pairs each theme rule with one mutation', () => {
    expect(Object.keys(broken).sort()).toEqual(
      themeRules.map((rule) => rule.id).sort(),
    );
  });

  it.each(Object.keys(broken))(
    '%s fires on its mutation and not on the built theme',
    (id) => {
      const copy = structuredClone(theme);
      broken[id]?.(copy);
      expect(ids(copy)).toContain(id);
      expect(ids(theme)).not.toContain(id);
    },
  );

  it('THEME-001 checks page text on the page and on the frame', () => {
    const copy = structuredClone(theme);
    copy.colors.dark!.page.pageFgMuted = copy.colors.dark!.page.frameBg;
    expect(
      validateTheme(copy, inventory).map((issue) => [issue.rule, issue.at]),
    ).toEqual([
      ['THEME-001', 'page.dark.pageFgMuted'],
      ['THEME-001', 'page.dark.pageFgMuted'],
    ]);
  });

  it('THEME-001 and THEME-002 check the theme set straight on a tinted page, where links sit', () => {
    const copy = structuredClone(theme);
    const { page, theme: set } = copy.colors.light!;
    page.pageBg = set.fg;
    expect(
      validateTheme(copy, inventory)
        .filter((issue) => issue.at?.startsWith('theme.light'))
        .map((issue) => [issue.rule, issue.at]),
    ).toEqual([
      ['THEME-001', 'theme.light.fg'],
      ['THEME-002', 'theme.light.focus'],
    ]);
  });

  it('THEME-008 keeps statuses, danger, icon sizes and the dialog size, and leaves the rest to the theme', () => {
    const at = (change: (d: Theme['defaults']) => void) => {
      const copy = structuredClone(theme);
      change(copy.defaults);
      return validateTheme(copy, inventory).map((issue) => issue.at);
    };
    expect(
      at((d) => {
        d.Button = { variant: 'default', size: 'md', look: 'rounded ghost' };
        d.Tabs = { variant: 'base' };
        d.Tag = { variant: 'accent', size: 'xs', look: 'bordered' };
      }),
    ).toEqual([]);
    expect(at((d) => (d.Button!.variant = 'danger'))).toEqual([
      'defaults.Button.variant',
    ]);
    expect(at((d) => (d.Toast!.status = 'success'))).toEqual([
      'defaults.Toast.status',
    ]);
    expect(at((d) => (d.Dialog!.size = 'lg'))).toEqual(['defaults.Dialog.size']);
  });

  it('THEME-009 wants the skeleton to show in cards and the backdrop to dim the page', () => {
    const at = (change: (t: Theme) => void) => {
      const copy = structuredClone(theme);
      change(copy);
      return validateTheme(copy, inventory)
        .filter((issue) => issue.rule === 'THEME-009')
        .map((issue) => issue.at);
    };
    expect(
      at((t) => (t.colors.dark!.base.bg = t.colors.dark!.page.skeleton)),
    ).toEqual(['page.dark.skeleton']);
    expect(at((t) => (t.colors.light!.page.backdrop = '#FFFFFF'))).toEqual([
      'page.light.backdrop',
    ]);
  });

  it('THEME-004 also checks radius values against the scale', () => {
    expect(
      ids({ ...theme, radius: { surface: '7px', control: '6px' } }),
    ).toEqual(['THEME-004']);
  });

  it('THEME-006 wants something in a needed part, the sidebars apart and a width for a fixed container', () => {
    const at = (change: (t: Theme) => void) => {
      const copy = structuredClone(theme);
      change(copy);
      return validateTheme(copy, inventory).map((issue) => issue.at);
    };
    expect(at((t) => (t.layouts.marketing.footer.needed = true))).toEqual([
      'marketing.footer',
    ]);
    expect(
      at((t) => {
        const { sidebar, extraSidebar } = t.layouts.app;
        Object.assign(sidebar, { needed: true, top: 'a', widthPx: 240 });
        Object.assign(extraSidebar, {
          needed: true,
          top: 'b',
          widthPx: 200,
          side: 'left',
        });
      }),
    ).toEqual(['app.extraSidebar.side']);
    expect(at((t) => (t.layouts.app.main.container = 'fixed'))).toEqual([
      'app.main.maxWidthPx',
    ]);
    // A 32 tall button and 12 above and below it need 56.
    expect(at((t) => (t.layouts.app.header.heightPx = 48))).toEqual([
      'app.header.heightPx',
    ]);
    expect(at((t) => (t.layouts.app.header.heightPx = 0))).toEqual([]);
  });

  it('THEME-007 keeps sections in range by kind and every padding at least its gap', () => {
    const at = (change: (t: Theme) => void) => {
      const copy = structuredClone(theme);
      change(copy);
      return validateTheme(copy, inventory).map((issue) => issue.at);
    };
    expect(
      at((t) => Object.assign(t.layouts.marketing.main, { sectionGap: '12', padding: '12' })),
    ).toEqual([]);
    expect(at((t) => (t.layouts.app.main.sectionGap = '12'))).toEqual([
      'app.main.sectionGap',
      'app.main.padding',
    ]);
    expect(at((t) => (t.layouts.marketing.header.gap = '6'))).toEqual([
      'marketing.header.padding',
    ]);
    // A part that is not needed, or a box with no padding, has nothing to check.
    expect(at((t) => (t.layouts.app.footer.gap = '6'))).toEqual([]);
    expect(at((t) => (t.layouts.app.main.padding = '0'))).toEqual([]);
  });
});
