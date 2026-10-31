import { z } from 'zod';
import { type Inventory, spacingKeys } from '../../ds/inventory';
import type { Brief } from './schema';

// The theme call (D3.3 E) writes every final value from the brief: the colors
// of each mode the brief names (brand, base, page and entity sets), a layout for app pages and one for marketing
// pages, and each component's default variants and look. The schema is built
// from the brief and the inventory, so the call writes exactly the modes,
// entity sets, spacing keys and component values that exist.

export const ROLES = [
  'bg',
  'fg',
  'fgMuted',
  'border',
  'hoverBg',
  'accentBg',
  'accentFg',
  'accentBorder',
  'accentHoverBg',
  'focus',
  'accentFocus',
  'shadow',
] as const;
export type Role = (typeof ROLES)[number];
/** The page's own colors; divider, backdrop and skeleton follow no hue and only have to show on the page (THEME-009). */
export const PAGE_ROLES = [
  'pageBg',
  'pageFg',
  'pageFgMuted',
  'frameBg',
  'divider',
  'backdrop',
  'skeleton',
] as const;
export type PageRole = (typeof PAGE_ROLES)[number];
export type Mode = 'light' | 'dark';

const Hex = z.string().describe('#RRGGBB');
const fields = <K extends string>(keys: readonly K[]) =>
  Object.fromEntries(keys.map((key) => [key, Hex])) as Record<K, typeof Hex>;
export const ColorSet = z.object(fields(ROLES));
export type ColorSet = z.infer<typeof ColorSet>;
export const PageColors = z.object(fields(PAGE_ROLES));
export type PageColors = z.infer<typeof PageColors>;

/** One mode's colors: the brand set, the base set most components use, the page, and a set per colored entity, by name. */
export type ModeColors = {
  theme: ColorSet;
  base: ColorSet;
  page: PageColors;
  entity: Record<string, ColorSet>;
};

/** The modes the brief's color scheme names. */
export const modesOf = (brief: Brief): Mode[] =>
  brief.colorScheme === 'both' ? ['light', 'dark'] : [brief.colorScheme];

/** The colored entities' set names: the noun in camelCase, `Shelf` as `shelf`. */
export const entitySets = (brief: Brief): { name: string; hue: number }[] =>
  brief.entities
    .filter((entity) => entity.colored)
    .map((entity) => ({
      name: entity.noun[0]!.toLowerCase() + entity.noun.slice(1),
      hue: entity.hue,
    }));

/** A page layout over a spacing schema: the inventory's keys for the call, any string for the artifact. */
export function pageLayoutSchema<S extends z.ZodType<string>>(spacing: S) {
  const separation = z
    .enum(['background', 'divider', 'shadow', 'none'])
    .describe(
      'How it sets off from the content: the frame background, a divider line, a shadow, or nothing',
    );
  const slot = (where: string) =>
    z.string().describe(`What sits ${where}, e.g. "the wordmark"; "" for nothing`);
  const bar = {
    needed: z.boolean(),
    start: slot('at the start'),
    center: slot('in the center'),
    end: slot('at the end'),
    heightPx: z.number().int().describe('0 sizes it to its content'),
    padding: spacing,
    gap: spacing,
    separation,
  };
  const Sidebar = z.object({
    needed: z.boolean(),
    side: z.enum(['left', 'right']),
    top: slot('at the top'),
    bottom: slot('at the bottom'),
    widthPx: z.number().int(),
    sticky: z
      .boolean()
      .describe('Stays in view while the content scrolls'),
    padding: spacing,
    gap: spacing,
    separation,
  });
  return z.object({
    docksFirst: z
      .enum(['header', 'sidebars'])
      .describe(
        'header: the header and footer span the full width and the sidebars run between them; sidebars: the sidebars run the full height and the header and footer sit between them',
      ),
    header: z.object({
      ...bar,
      sticky: z.boolean().describe('Stays in view while the page scrolls'),
      overlay: z
        .boolean()
        .describe(
          'Lies over the first section, such as a light header on a hero, instead of above it',
        ),
    }),
    sidebar: Sidebar,
    extraSidebar: Sidebar,
    footer: z.object(bar),
    main: z.object({
      container: z
        .enum(['fluid', 'fixed'])
        .describe('fluid fills the space the frame leaves; fixed stops at maxWidthPx'),
      maxWidthPx: z.number().int().describe('The container width when fixed; 0 when fluid'),
      padding: spacing.describe('The page padding around the content'),
      align: z.enum(['start', 'center']),
      sectionGap: spacing.describe('The gap between sections'),
      fullBleed: z
        .boolean()
        .describe(
          'Section backgrounds run the full width while their content stays in the container',
        ),
      separation: separation.describe(
        'How the content area sets off from the frame: its own panel background, a border, a shadow, or nothing',
      ),
    }),
  });
}
const AnyLayout = pageLayoutSchema(z.string());
export type PageLayout = z.infer<typeof AnyLayout>;
export const Layouts = z.object({ app: AnyLayout, marketing: AnyLayout });
export type Layouts = z.infer<typeof Layouts>;

/** Per component: a value for each variant its recipe defaults, and its look. */
export type ComponentDefaults = Record<string, Record<string, string>>;

/** What the theme call returns. */
export type ThemeCall = {
  colors: Partial<Record<Mode, ModeColors>>;
  layouts: Layouts;
  defaults: ComponentDefaults;
};

export function makeThemeSchema(
  brief: Brief,
  inv: Inventory,
): z.ZodType<ThemeCall> {
  const entity = z.object(
    Object.fromEntries(entitySets(brief).map(({ name }) => [name, ColorSet])),
  );
  const mode = z.object({
    theme: ColorSet,
    base: ColorSet,
    page: PageColors,
    entity,
  });
  const spacing = z
    .enum(spacingKeys(inv))
    .describe('A spacing token key: 4 means 16px');
  const Layout = pageLayoutSchema(spacing);
  const defaults = inv.components.flatMap((component) => {
    const values: Record<string, z.ZodType<string>> = {};
    for (const prop of Object.keys(component.defaults ?? {})) {
      const options = component.variants[prop];
      if (options?.length) values[prop] = z.enum(options as [string, ...string[]]);
    }
    if (component.looks?.length)
      values.look = z.enum(component.looks as [string, ...string[]]);
    return Object.keys(values).length
      ? [[component.name, z.object(values)] as const]
      : [];
  });
  return z.object({
    colors: z.object(
      Object.fromEntries(modesOf(brief).map((name) => [name, mode])),
    ),
    layouts: z.object({ app: Layout, marketing: Layout }),
    defaults: z.object(Object.fromEntries(defaults)),
  }) as unknown as z.ZodType<ThemeCall>;
}
