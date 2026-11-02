import { readFileSync } from 'node:fs';
import { converter } from 'culori';
import { describe, expect, it } from 'vitest';
import { runRules } from '../../../core/rules';
import type { Inventory } from '../../../ds/inventory';
import { buildTheme, Theme } from './build';
import { ramp, rampsOf } from './ramps';
import { makeThemeSchema } from './schema';
import { themeRules } from './validation/validation';

const read = (path: string) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as unknown;
const inventory = read('../../../ds/__fixtures__/inventory.json') as Inventory;
const call = makeThemeSchema(inventory).parse(
  read('../__fixtures__/reading-list.theme.json'),
);
const { brief } = call;
const theme = buildTheme(call);
const validateTheme = (t: Theme, inv: Inventory) => runRules(themeRules, { theme: t, inventory: inv });
const ids = (t: Theme) =>
  validateTheme(t, inventory).map((issue) => issue.rule);

describe('makeThemeSchema', () => {
  it('takes the brief first, then a list of modes; THEME-010 holds the modes to the brief', () => {
    const schema = makeThemeSchema(inventory);
    const { brief: _brief, ...values } = call;
    expect(schema.safeParse(values).success).toBe(false);
    expect(schema.safeParse({ ...call, colors: call.colors.slice(0, 1) }).success).toBe(true);
  });

  it("takes each component's defaults from its own values", () => {
    const schema = makeThemeSchema(inventory);
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
  it('turns the call into a valid theme with the brief fonts, mono included, and each mode its own background', () => {
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
    expect(validateTheme(theme, inventory)).toEqual([]);
    expect(theme.colors.light!.page.pageBackground).toBe(call.colors[0]!.background);
    expect(theme.colors.dark!.page.pageBackground).toBe(call.colors[1]!.background);
  });

  it('turns each step into the hex of its ramp, in capitals, for only the modes the brief names', () => {
    const ramps = rampsOf(brief);
    expect(theme.colors.light!.theme.bg).toBe(ramps.light!.theme[1]);
    expect(theme.colors.dark!.page.frameBg).toBe(ramps.dark!.frame[2]);
    expect(theme.colors.light!.page.divider).toBe(ramps.light!.base[4]);
    expect(theme.colors.light!.theme.bg).toMatch(/^#[0-9A-F]{6}$/);
    const light = buildTheme({ ...call, brief: { ...brief, colorScheme: 'light' } });
    expect(light.modes).toEqual(['light']);
    expect(light.colors.dark).toBeUndefined();
  });

  it('stays the same for the same input', () => {
    expect(buildTheme(call)).toEqual(theme);
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
    'THEME-011': (t) => (t.logo.colors.light = t.colors.light!.page.frameBg),
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

  it('THEME-001 checks page text on the page, on the frame and on every color of the background', () => {
    const copy = structuredClone(theme);
    copy.colors.dark!.page.pageFgMuted = copy.colors.dark!.page.frameBg;
    const issues = validateTheme(copy, inventory);
    expect(issues.map((issue) => [issue.rule, issue.at])).toEqual(
      Array(4).fill(['THEME-001', 'page.dark.pageFgMuted']),
    );
    // The dark background is a gradient of two colors.
    expect(issues.filter((i) => i.message.includes("the background's #"))).toHaveLength(2);
  });

  it('THEME-001 and THEME-002 check the theme set straight on a tinted page, where links sit', () => {
    const copy = structuredClone(theme);
    const { page, theme: set } = copy.colors.light!;
    page.pageBg = set.focus;
    expect(
      validateTheme(copy, inventory)
        .filter((issue) => issue.at?.startsWith('theme.light'))
        .map((issue) => [issue.rule, issue.at]),
    ).toEqual([
      ['THEME-001', 'theme.light.fg'],
      ['THEME-002', 'theme.light.border'],
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
    // A glow in the background the divider, and so a card's border, vanishes on.
    expect(
      at((t) => {
        const { page } = t.colors.dark!;
        page.pageBackground = `radial-gradient(circle, ${page.divider} 0%, transparent 60%), ${page.pageBg}`;
      }),
    ).toEqual(['page.dark.divider']);
  });

  it('THEME-011 wants a weight the logo font ships, and the wordmark readable on the frame and the page', () => {
    const at = (change: (t: Theme) => void) => {
      const copy = structuredClone(theme);
      change(copy);
      return validateTheme(copy, inventory).filter((i) => i.rule === 'THEME-011').map((i) => i.at);
    };
    expect(theme.logo).toMatchObject({ family: 'Playfair Display', weight: '600', letterSpacing: '0em' });
    expect(at((t) => (t.logo.family = 'JetBrains Mono') && (t.logo.weight = '900'))).toEqual(['logo.weight']);
    expect(at((t) => (t.logo.colors.dark = t.colors.dark!.page.pageBg))).toEqual(['logo.dark.frameBg', 'logo.dark.pageBg']);
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
    // The default md button is 40 tall; with 16 above and below it needs 72.
    expect(at((t) => (t.layouts.marketing.header.heightPx = 64))).toEqual([
      'marketing.header.heightPx',
    ]);
    expect(at((t) => (t.layouts.marketing.header.heightPx = 72))).toEqual([]);
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

describe('ramps', () => {
  const hues = Array.from({ length: 12 }, (_, i) => i * 30);
  const chromas = ['muted', 'balanced', 'vivid'] as const;
  const hueOf = converter('oklch');

  it('keep their hue on every step with color, in both modes', () => {
    for (const hue of hues)
      for (const chroma of chromas)
        for (const mode of ['light', 'dark'] as const)
          for (const hex of ramp(hue, chroma, mode)) {
            const color = hueOf(hex)!;
            if ((color.c ?? 0) < 0.03) continue;
            const off = Math.abs((((color.h ?? 0) - hue + 540) % 360) - 180);
            expect(off, `${hue} ${chroma} ${mode} ${hex}`).toBeLessThan(10);
          }
  });

  it('never give two hues the same color on a step', () => {
    for (const chroma of chromas)
      for (const mode of ['light', 'dark'] as const) {
        const ramps = hues.map((hue) => ramp(hue, chroma, mode));
        for (let step = 0; step < 12; step += 1) {
          const colors = ramps.map((r) => r[step]);
          expect(new Set(colors).size, `${chroma} ${mode} step ${step + 1}`).toBe(hues.length);
        }
      }
  });
});
