/**
 * The one shape every color set shares: theme, neutral, each status and each
 * future entity. Default foregrounds work on the two default backgrounds;
 * `accentForeground` works on the two accent backgrounds. Nothing else is
 * guaranteed — check contrast before pairing colors across roles.
 */
export type ColorSet = {
  /** Regular/subtle container background. */
  bg: string;
  /** Main text and icons on default backgrounds. */
  fg: string;
  /** Supporting text and icons on default backgrounds. */
  fgMuted: string;
  /** Regular control/container boundary. */
  border: string;
  /** Default background on hover; also the selected fill. */
  hoverBg: string;
  /** Filled/emphasized container background. */
  accentBg: string;
  /** Text and icons on accent backgrounds. */
  accentFg: string;
  /** Filled/emphasized control boundary. */
  accentBorder: string;
  /** Accent background on hover; also the selected accent fill. */
  accentHoverBg: string;
  /** Shadow color only; components own offset, blur, spread and opacity. */
  shadow: string;
};

export type NeutralColorSet = ColorSet & {
  /** Separator lines; not a replacement for interactive boundaries. */
  divider: string;
  /** Overlay base color; components apply their own opacity. */
  backdrop: string;
  /** Placeholder shapes shown while content loads. */
  skeleton: string;
};

export const colors = {
  base: {
    light: {
      bg: '#FFFFFF',
      fg: '#18181B',
      fgMuted: '#52525B',
      border: '#C4C4CC',
      hoverBg: '#F7F7F8',
      accentBg: '#18181B',
      accentFg: '#FAFAFA',
      accentBorder: '#18181B',
      accentHoverBg: '#2F2F32',
      shadow: '#000000',
      divider: '#ECEBE7',
      backdrop: '#1A1A17',
      skeleton: '#E4E4E7',
    } satisfies NeutralColorSet,
    dark: {
      bg: '#18181B',
      fg: '#FAFAFA',
      fgMuted: '#A1A1AA',
      border: '#52525B',
      hoverBg: '#27272A',
      accentBg: '#FAFAFA',
      accentFg: '#18181B',
      accentBorder: '#FAFAFA',
      accentHoverBg: '#D9D9DE',
      shadow: '#000000',
      divider: '#2A2926',
      backdrop: '#000000',
      skeleton: '#3F3F46',
    } satisfies NeutralColorSet,
  },
  theme: {
    light: {
      bg: '#F7EDFE',
      fg: '#402060',
      fgMuted: '#8145B5',
      border: '#BE93E4',
      hoverBg: '#F2E2FC',
      accentBg: '#8E4EC6',
      accentFg: '#FFFFFF',
      accentBorder: '#8347B9',
      accentHoverBg: '#8347B9',
      shadow: '#000000',
    } satisfies ColorSet,
    dark: {
      bg: '#301C3B',
      fg: '#ECD9FA',
      fgMuted: '#D19DFF',
      border: '#8457AA',
      hoverBg: '#3D224E',
      accentBg: '#8E4EC6',
      accentFg: '#FFFFFF',
      accentBorder: '#9A5CD0',
      accentHoverBg: '#8347B9',
      shadow: '#000000',
    } satisfies ColorSet,
  },
  status: {
    light: {
      success: {
        bg: '#E6F6EB',
        fg: '#193B2D',
        fgMuted: '#34634A',
        border: '#447E5F',
        hoverBg: '#D6F1DF',
        accentBg: '#447E5F',
        accentFg: '#FFFFFF',
        accentBorder: '#34634A',
        accentHoverBg: '#3C7055',
        shadow: '#000000',
      } satisfies ColorSet,
      warning: {
        bg: '#FFF2C2',
        fg: '#4F3422',
        fgMuted: '#7C562D',
        border: '#9D6B3B',
        hoverBg: '#FFEE9C',
        accentBg: '#F1C978',
        accentFg: '#4F3422',
        accentBorder: '#9D6B3B',
        accentHoverBg: '#EFC06A',
        shadow: '#000000',
      } satisfies ColorSet,
      error: {
        bg: '#FEEBEC',
        fg: '#641723',
        fgMuted: '#953D3B',
        border: '#B74D48',
        hoverBg: '#FFDBDC',
        accentBg: '#B74D48',
        accentFg: '#FFFFFF',
        accentBorder: '#953D3B',
        accentHoverBg: '#A54440',
        shadow: '#000000',
      } satisfies ColorSet,
      info: {
        bg: '#E6F4FE',
        fg: '#113264',
        fgMuted: '#305E90',
        border: '#3D76B3',
        hoverBg: '#D5EFFF',
        accentBg: '#3D76B3',
        accentFg: '#FFFFFF',
        accentBorder: '#305E90',
        accentHoverBg: '#366AA1',
        shadow: '#000000',
      } satisfies ColorSet,
    },
    dark: {
      success: {
        bg: '#132D21',
        fg: '#B1F1CB',
        fgMuted: '#73CE9A',
        border: '#73CE9A',
        hoverBg: '#113B29',
        accentBg: '#589E76',
        accentFg: '#0E1512',
        accentBorder: '#73CE9A',
        accentHoverBg: '#5EA97F',
        shadow: '#000000',
      } satisfies ColorSet,
      warning: {
        bg: '#302008',
        fg: '#FFE7B3',
        fgMuted: '#F1CE6F',
        border: '#F1CE6F',
        hoverBg: '#3F2700',
        accentBg: '#F1C978',
        accentFg: '#16120C',
        accentBorder: '#F1CE6F',
        accentHoverBg: '#F3D872',
        shadow: '#000000',
      } satisfies ColorSet,
      error: {
        bg: '#3B1219',
        fg: '#FFD1D9',
        fgMuted: '#ECA19E',
        border: '#ECA19E',
        hoverBg: '#500F1C',
        accentBg: '#CD6360',
        accentFg: '#191111',
        accentBorder: '#ECA19E',
        accentHoverBg: '#D5726F',
        shadow: '#000000',
      } satisfies ColorSet,
      info: {
        bg: '#0D2847',
        fg: '#C2E6FF',
        fgMuted: '#87B7E9',
        border: '#87B7E9',
        hoverBg: '#003362',
        accentBg: '#4B92DE',
        accentFg: '#0D1520',
        accentBorder: '#87B7E9',
        accentHoverBg: '#619FE2',
        shadow: '#000000',
      } satisfies ColorSet,
    },
  },
  entity: {
    light: {},
    dark: {},
  },
};

export const textVars: Record<string, string> = {}; // text-*
export const bgVars: Record<string, string> = {}; // bg-*
export const borderVars: Record<string, string> = {}; // border-*, outline-*
export const lightTheme: Record<string, string> = {};
export const darkTheme: Record<string, string> = {};

const kebab = (value: string) =>
  value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

const processColors = (
  set: any,
  prefix: string[] = [],
  varObj: Record<string, unknown> = {},
  theme?: 'light' | 'dark',
) => {
  for (const [key, entry] of Object.entries(set)) {
    if (key === 'theme' || key === 'status' || key === 'entity') {
      processColors(entry, prefix, varObj, theme);
      continue;
    }

    if (key === 'light' || key === 'dark') {
      processColors(entry, prefix, varObj, key as 'light' | 'dark');
      continue;
    }

    const path = [...prefix, kebab(key)];
    if (entry && typeof entry === 'object') {
      varObj[key] = {};
      processColors(entry, path, varObj[key] as Record<string, unknown>, theme);
      continue;
    }

    const varName = `${path.join('-')}`;
    const cssVar = `var(--weave-color-${varName})`;
    let tailwindKey = varName;
    let tailwindSet: Record<string, string> = {};
    if (/(^|-)bg(-|$)/.test(varName)) {
      tailwindKey = varName.replace(/(^bg-|-bg$|bg-|^bg$)/, '');
      tailwindSet = bgVars;
    } else if (/(^|-)fg(-|$)/.test(varName)) {
      tailwindKey = varName.replace(/(^fg-|-fg$|fg-|^fg$)/, '');
      tailwindSet = textVars;
    } else if (/(^|-)border(-|$)/.test(varName)) {
      tailwindKey = varName.replace(/(^border-|-border$|border-|^border$)/, '');
      tailwindSet = borderVars;
    }

    if (tailwindKey === '') tailwindKey = 'default';
    tailwindSet[tailwindKey] = cssVar;

    const themeObj = theme === 'dark' ? darkTheme : lightTheme;
    themeObj[cssVar] = entry as string;
    varObj[key] = cssVar;
  }

  return varObj;
};

export const colorTokens = processColors(colors) as ColorSet & {
  base: NeutralColorSet;
  success: ColorSet;
  warning: ColorSet;
  error: ColorSet;
  info: ColorSet;
};
