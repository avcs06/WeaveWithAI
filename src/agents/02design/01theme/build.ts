import { wcagContrast } from 'culori';
import { z } from 'zod';
import { type Status, STATUSES } from './brief';
import { rampsOf } from './ramps';
import {
  type Brief,
  type CallLayouts,
  chosenFonts,
  ColorSet,
  type ComponentDefaults,
  Layouts,
  type Mode,
  modesOf,
  PageColors,
  type PageRole,
  type Role,
  ROLES,
  setName,
  type StepSet,
  type ThemeCall,
} from './schema';

// The theme: the theme call picks every color as a step of a
// ramp, the logo, the page layouts and the component defaults; code
// turns the steps into hex and adds the brief's fonts, radius and focus ring,
// and the logo's family and spacing.

export type { ColorSet, Mode } from './schema';

const ModeColors = z.object({
  theme: ColorSet,
  base: ColorSet,
  page: PageColors,
  entity: z.record(z.string(), ColorSet),
  status: z.object(
    Object.fromEntries(STATUSES.map((status) => [status, ColorSet])) as Record<
      Status,
      typeof ColorSet
    >,
  ),
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
  /** The wordmark: its family, weight, case, letter spacing in em, and its color in each mode. */
  logo: z.object({
    family: z.string(),
    weight: z.string(),
    case: z.enum(['as written', 'upper', 'lower']),
    letterSpacing: z.string(),
    colors: z.object({
      light: z.string().optional(),
      dark: z.string().optional(),
    }),
  }),
  layouts: Layouts,
  defaults: z.record(z.string(), z.record(z.string(), z.string())),
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

/** Each mode's theme, base, entity and status sets, by name. */
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
      ...STATUSES.map((name) => ({ name, mode, colors: colors.status[name] })),
    ];
  });
}

/** Letter spacing presets for the wordmark, in em. */
const LETTER_SPACING: Record<ThemeCall['logo']['letterSpacing'], string> = {
  tight: '-0.02em',
  normal: '0em',
  wide: '0.06em',
  wider: '0.12em',
};

/** Radius presets on the design system's scale: surface, then control. */
const RADIUS: Record<Brief['radius'], [string, string]> = {
  sharp: ['4px', '4px'],
  soft: ['8px', '6px'],
  round: ['16px', '10px'],
  pill: ['16px', '9999px'],
};

const NO_SIDEBAR: Layouts['app']['sidebar'] = {
  needed: false,
  side: 'left',
  top: '',
  bottom: '',
  widthPx: 0,
  sticky: false,
  padding: '0',
  gap: '0',
  separation: 'none',
};

/** The marketing layout in the app layout's shape: the header spans the page and no sidebar is needed. */
const marketingLayout = (
  marketing: CallLayouts['marketing'],
): Layouts['marketing'] => ({
  docksFirst: 'header',
  header: marketing.header,
  sidebar: NO_SIDEBAR,
  footer: marketing.footer,
  main: marketing.main,
});

/** The theme call's artifact: the brief the later stages read, and the theme its values became. */
export type Themed = { brief: Brief; theme: Theme };

export const themed = (call: ThemeCall): Themed => ({
  brief: call.brief,
  theme: buildTheme(call),
});

/** The theme call's values as one theme: each step turned into its ramp's hex, in capitals; a mode the brief does not name is left out (THEME-010). */
export function buildTheme(call: ThemeCall): Theme {
  const { brief } = call;
  const ramps = rampsOf(brief);
  const modes = modesOf(brief);
  const colors = Object.fromEntries(
    modes.flatMap((mode) => {
      const values = call.colors.find((c) => c.mode === mode);
      const ramp = ramps[mode];
      if (!values || !ramp) return [];
      const at = (hexes: string[], step: number) => hexes[step - 1] ?? '';
      const set = (hexes: string[], picked: StepSet) =>
        Object.fromEntries(
          ROLES.map((role) => [role, at(hexes, picked[role])]),
        ) as ColorSet;
      const { page } = values;
      return [
        [
          mode,
          {
            theme: set(ramp.theme, values.theme),
            base: set(ramp.base, values.base),
            page: {
              pageBg: at(ramp[page.pageBg.ramp], page.pageBg.step),
              pageFg: at(ramp[page.pageFg.ramp], page.pageFg.step),
              pageFgMuted: at(
                ramp[page.pageFgMuted.ramp],
                page.pageFgMuted.step,
              ),
              frameBg: at(ramp.frame, page.frameBg),
              divider: at(ramp[page.divider.ramp], page.divider.step),
              backdrop: at(ramp[page.backdrop.ramp], page.backdrop.step),
              skeleton: at(ramp[page.skeleton.ramp], page.skeleton.step),
              pageBackground: values.background,
            },
            entity: Object.fromEntries(
              values.entities.map(({ noun, steps }) => [
                setName(noun),
                set(ramp.entity[setName(noun)] ?? [], steps),
              ]),
            ),
            status: Object.fromEntries(
              STATUSES.map((status) => [
                status,
                set(ramp.status[status], values.status[status]),
              ]),
            ) as Record<Status, ColorSet>,
          },
        ],
      ];
    }),
  );
  const [surface, control] = RADIUS[brief.radius];
  const defaults: ComponentDefaults = call.defaults;
  const fonts = chosenFonts(brief);
  const logoColors = Object.fromEntries(
    modes.flatMap((mode) => {
      const values = call.colors.find((c) => c.mode === mode);
      const ramp = ramps[mode];
      return values && ramp
        ? [[mode, ramp[values.logo.ramp][values.logo.step - 1] ?? '']]
        : [];
    }),
  );
  return {
    modes,
    colors,
    fonts,
    radius: { surface, control },
    focusRing: brief.focusRing,
    logo: {
      family: fonts[call.logo.font],
      weight: call.logo.weight,
      case: call.logo.case,
      letterSpacing: LETTER_SPACING[call.logo.letterSpacing],
      colors: logoColors,
    },
    layouts: {
      app: call.layouts.app,
      marketing: marketingLayout(call.layouts.marketing),
    },
    defaults,
  };
}
