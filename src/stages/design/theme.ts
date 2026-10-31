import { wcagContrast } from 'culori';
import { z } from 'zod';
import type { Brief } from './schema';
import {
  ColorSet,
  type ComponentDefaults,
  Layouts,
  type Mode,
  modesOf,
  PageColors,
  type PageRole,
  type Role,
  type ThemeCall,
} from './schema-theme';

// The theme (DS4a, D3.3 E): the theme call writes every color, the page
// layouts and the component defaults; code adds the brief's fonts, radius,
// focus ring and density and the contrast table the THEME rules check.

export type { ColorSet, Mode } from './schema-theme';

const ModeColors = z.object({
  theme: ColorSet,
  base: ColorSet,
  page: PageColors,
  entity: z.record(z.string(), ColorSet),
});

export const Theme = z.object({
  modes: z.array(z.enum(['light', 'dark'])),
  colors: z.object({
    light: ModeColors.optional(),
    dark: ModeColors.optional(),
  }),
  fonts: z.object({ ui: z.string(), display: z.string(), mono: z.string() }),
  radius: z.object({ surface: z.string(), control: z.string() }),
  focusRing: z.enum(['halo', 'offset', 'glow']),
  density: z.enum(['compact', 'comfortable', 'spacious']),
  layouts: Layouts,
  defaults: z.record(z.string(), z.record(z.string(), z.string())),
  contrast: z.array(
    z.object({
      set: z.string(),
      mode: z.enum(['light', 'dark']),
      pair: z.string(),
      ratio: z.number(),
    }),
  ),
});
export type Theme = z.infer<typeof Theme>;

/** Text pairs that need 4.5:1 (THEME-001), foreground first. */
export const TEXT_PAIRS: [Role, Role][] = [
  ['fg', 'bg'],
  ['fgMuted', 'bg'],
  ['fg', 'hoverBg'],
  ['accentFg', 'accentBg'],
  ['accentFg', 'accentHoverBg'],
];
/** Page text on the page and on the frame, 4.5:1 too (THEME-001). */
export const PAGE_PAIRS: [PageRole, PageRole][] = [
  ['pageFg', 'pageBg'],
  ['pageFgMuted', 'pageBg'],
  ['pageFg', 'frameBg'],
  ['pageFgMuted', 'frameBg'],
];
/** Quiet colors that only have to show on the page and the frame: 1.1:1 (THEME-009). */
export const QUIET_PAIRS: [PageRole, PageRole][] = [
  ['divider', 'pageBg'],
  ['divider', 'frameBg'],
  ['skeleton', 'pageBg'],
  ['skeleton', 'frameBg'],
];
/** Pairs that need 3:1 (THEME-002). */
export const EDGE_PAIRS: [Role, Role][] = [
  ['border', 'bg'],
  ['focus', 'bg'],
];
/** The sets drawn straight on the page and the frame, as a link draws them: the brand's and the base. */
export const SURFACE_SETS = ['theme', 'base'] as const;
/** A surface set's text on the page and the frame: 4.5:1 (THEME-001). */
export const SURFACE_TEXT_PAIRS: [Role, PageRole][] = [
  ['fg', 'pageBg'],
  ['fg', 'frameBg'],
];
/** A surface set's edges on the page and the frame, a link's underline and focus ring: 3:1 (THEME-002). */
export const SURFACE_EDGE_PAIRS: [Role, PageRole][] = [
  ['border', 'pageBg'],
  ['focus', 'pageBg'],
  ['border', 'frameBg'],
  ['focus', 'frameBg'],
];

export const isHex = (value: string) => /^#[0-9A-F]{6}$/i.test(value);
/** The WCAG ratio, or NaN when either is not hex: THEME-005 reports those. */
export const ratio = (a: string, b: string) =>
  isHex(a) && isHex(b) ? wcagContrast(a, b) : Number.NaN;

/** Each mode's theme, base and entity sets, by name. */
export function colorSets(
  theme: Pick<Theme, 'modes' | 'colors'>,
): { name: string; mode: Mode; colors: ColorSet }[] {
  return theme.modes.flatMap((mode) => {
    const colors = theme.colors[mode];
    if (!colors) return [];
    return [
      { name: 'theme', mode, colors: colors.theme },
      { name: 'base', mode, colors: colors.base },
      ...Object.entries(colors.entity).map(([name, set]) => ({
        name,
        mode,
        colors: set,
      })),
    ];
  });
}

/** Every checked pair of every set and mode with its ratio, for the validator and the demo. */
export function contrastTable(
  theme: Pick<Theme, 'modes' | 'colors'>,
): Theme['contrast'] {
  const row = (set: string, mode: Mode, fg: string, bg: string, a: string, b: string) => ({
    set,
    mode,
    pair: `${fg} on ${bg}`,
    ratio: Math.round((ratio(a, b) || 0) * 100) / 100,
  });
  return [
    ...theme.modes.flatMap((mode) => {
      const colors = theme.colors[mode];
      if (!colors) return [];
      const { page } = colors;
      return [
        ...[...PAGE_PAIRS, ...QUIET_PAIRS].map(([fg, bg]) =>
          row('page', mode, fg, bg, page[fg], page[bg]),
        ),
        ...SURFACE_SETS.flatMap((name) =>
          [...SURFACE_TEXT_PAIRS, ...SURFACE_EDGE_PAIRS].map(([fg, bg]) =>
            row(name, mode, fg, bg, colors[name][fg], page[bg]),
          ),
        ),
      ];
    }),
    ...colorSets(theme).flatMap(({ name, mode, colors }) =>
      [...TEXT_PAIRS, ...EDGE_PAIRS].map(([fg, bg]) =>
        row(name, mode, fg, bg, colors[fg], colors[bg]),
      ),
    ),
  ];
}

/** Radius presets on the design system's scale: surface, then control. */
const RADIUS: Record<Brief['radius'], [string, string]> = {
  sharp: ['4px', '4px'],
  soft: ['8px', '6px'],
  round: ['16px', '10px'],
  pill: ['16px', '9999px'],
};

/** The brief and the theme call's values as one theme; hex values in capitals. */
export function buildTheme(brief: Brief, call: ThemeCall): Theme {
  const upper = <T extends Record<string, string>>(set: T): T =>
    Object.fromEntries(
      Object.entries(set).map(([role, hex]) => [role, hex.toUpperCase()]),
    ) as T;
  const modes = modesOf(brief);
  const colors = Object.fromEntries(
    modes.flatMap((mode) => {
      const values = call.colors[mode];
      if (!values) return [];
      const entity = Object.fromEntries(
        Object.entries(values.entity).map(([name, set]) => [name, upper(set)]),
      );
      return [
        [
          mode,
          {
            theme: upper(values.theme),
            base: upper(values.base),
            page: upper(values.page),
            entity,
          },
        ],
      ];
    }),
  );
  const [surface, control] = RADIUS[brief.radius];
  const defaults: ComponentDefaults = call.defaults;
  return {
    modes,
    colors,
    fonts: { ...brief.fonts },
    radius: { surface, control },
    focusRing: brief.focusRing,
    density: brief.density,
    layouts: call.layouts,
    defaults,
    contrast: contrastTable({ modes, colors }),
  };
}
