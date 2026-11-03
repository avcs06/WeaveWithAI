import { z } from 'zod';
import { type Inventory, spacingKeys } from '../../../ds/inventory';
import { Brief, type Status, STATUSES } from './brief';

// The theme call sets the direction and every final
// value at once: the brief, the logo, the colors of each mode its color scheme
// names (brand, base, page, logo, status and entity sets) as steps of ramps
// code computes from the brief's hues, a layout for app pages and one
// for marketing pages, and each component's default variants and look. The schema is built from the
// inventory, so the call writes only spacing keys and component values that
// exist; THEME-010 checks the modes and entity sets against the brief the same
// answer gives.

export { Brief, chosenFonts } from './brief';

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
/** The page's own colors; divider, backdrop and skeleton carry no text, so they only have to show on the page (THEME-009). */
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
export const PageColors = z.object({
  ...fields(PAGE_ROLES),
  pageBackground: z
    .string()
    .describe(
      'The page background as one CSS background value; pageBg is its solid color',
    ),
});
export type PageColors = z.infer<typeof PageColors>;

/** A step of a ramp: 1 is the lightest in light mode and the darkest in dark mode, 12 the other end. */
export const STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export type Step = (typeof STEPS)[number];
const Step = z.literal(STEPS).describe('A step of its ramp, 1 to 12');
const steps = <K extends string>(keys: readonly K[]) =>
  Object.fromEntries(keys.map((key) => [key, Step])) as Record<K, typeof Step>;
/** A set's twelve roles, each a step of the set's ramp. */
export const StepSet = z.object(steps(ROLES));
export type StepSet = z.infer<typeof StepSet>;
/** A page color: a step of the base set's ramp or the brand's (`theme`). */
const PageStep = z.object({ ramp: z.enum(['base', 'theme']), step: Step });
/** The page's colors as steps: its own from the base or the brand ramp, the frame's from the frame ramp. */
export const PageSteps = z.object({
  pageBg: PageStep.describe(
    "The page's solid color: behind its background, and the color disabled controls fade into",
  ),
  pageFg: PageStep,
  pageFgMuted: PageStep,
  frameBg: Step.describe('A step of the frame ramp, 1 to 12'),
  divider: PageStep,
  backdrop: PageStep,
  skeleton: PageStep,
});
export type PageSteps = z.infer<typeof PageSteps>;

/** One mode's colors as the call picks them: its background, and each set by step. */
export const ModeSteps = z.object({
  mode: z.enum(['light', 'dark']),
  background: z
    .string()
    .describe(
      'The page background in this mode as one CSS background value of colors and gradients, such as "linear-gradient(180deg, #FBF7F2 0%, #F2EADF 100%)"',
    ),
  theme: StepSet,
  base: StepSet,
  page: PageSteps,
  logo: PageStep.describe(
    "The wordmark's color: on the frame, and on the page under an overlay header",
  ),
  status: z
    .object(
      Object.fromEntries(STATUSES.map((status) => [status, StepSet])) as Record<
        Status,
        typeof StepSet
      >,
    )
    .describe(
      'A set for each status, from its own ramp: toasts, alerts, badges and field errors wear them',
    ),
  entities: z
    .array(z.object({ noun: z.string(), steps: StepSet }))
    .describe(
      'A set for each colored entity of the brief, by noun. [] when none is colored',
    ),
});
export type ModeSteps = z.infer<typeof ModeSteps>;

/** The app's name set as its logo, a wordmark: the app ships no image files and the design system has no icons for a mark. */
export const Logo = z.object({
  font: z
    .enum(['ui', 'display', 'mono'])
    .describe("Which of the brief's fonts sets it"),
  weight: z
    .enum(['400', '500', '600', '700', '800', '900'])
    .describe('A weight its font has'),
  case: z.enum(['as written', 'upper', 'lower']),
  letterSpacing: z.enum(['tight', 'normal', 'wide', 'wider']),
});
export type Logo = z.infer<typeof Logo>;

/** The modes the brief's color scheme names. */
export const modesOf = (brief: Brief): Mode[] =>
  brief.colorScheme === 'both' ? ['light', 'dark'] : [brief.colorScheme];

/** An entity set's name: the noun in camelCase, `Shelf` as `shelf`. */
export const setName = (noun: string) =>
  noun.slice(0, 1).toLowerCase() + noun.slice(1);

/** The colored entities' set names and hues. */
export const entitySets = (brief: Brief): { name: string; hue: number }[] =>
  brief.entities
    .filter((entity) => entity.colored)
    .map((entity) => ({ name: setName(entity.noun), hue: entity.hue }));

/**
 * The page layouts over a spacing schema: the inventory's keys for the call,
 * any string for the artifact. Public pages have no sidebar, so the
 * marketing layout has neither it nor `docksFirst`.
 */
export function pageLayoutSchemas<S extends z.ZodType<string>>(spacing: S) {
  const separation = z
    .enum(['background', 'divider', 'shadow', 'none'])
    .describe(
      'How it sets off from the content: the frame background, a divider line, a shadow, or nothing',
    );
  const slot = (where: string) =>
    z
      .string()
      .describe(`What sits ${where}, e.g. "the wordmark"; "" for nothing`);
  // Code fixes the header's padding, so every theme's header is the same height.
  const header = {
    needed: z.boolean(),
    start: slot('at the start'),
    center: slot('in the center'),
    end: slot('at the end'),
    gap: spacing,
    separation,
    overlay: z
      .boolean()
      .describe(
        'Lies over the first section, such as a light header on a hero, instead of above it',
      ),
  };
  // The logo and the account sit in the header or the sidebar, never in a footer.
  const footerSlot = (where: string) =>
    z
      .string()
      .describe(
        `What sits ${where}, e.g. "the site links"; never the logo or the account; "" for nothing`,
      );
  const footerSpacing = {
    padding: spacing.describe('Around its items'),
    gap: spacing,
    separation,
  };
  const appFooter = z.object({
    needed: z.boolean(),
    start: footerSlot('at the start'),
    center: footerSlot('in the center'),
    end: footerSlot('at the end'),
    ...footerSpacing,
  });
  // A site's footer may run to several lines, such as columns of links over a line of small print.
  const marketingFooter = z.object({
    needed: z.boolean(),
    content: z
      .string()
      .describe(
        'What it holds, in a few words, on one or several lines, e.g. "the site links in columns, then a line of small print"; never the logo or the account; "" for nothing',
      ),
    ...footerSpacing,
  });
  // A sidebar is a menu: its spacing is the menu's, and its rows scroll between what sits fixed above and below them.
  const Sidebar = z.object({
    needed: z.boolean(),
    side: z.enum(['left', 'right']),
    top: slot('fixed at the top'),
    items: slot('in the rows between, e.g. "the navigation"'),
    bottom: slot('fixed at the bottom'),
    widthPx: z.number().int(),
    separation,
  });
  // Only the marketing page scrolls as a whole; the app's frame stays in place while its main region scrolls.
  const sticky = z.boolean().describe('Stays in view while the page scrolls');
  const main = z.object({
    container: z
      .enum(['fluid', 'fixed'])
      .describe(
        'fluid fills the space the frame leaves; fixed stops at maxWidthPx',
      ),
    maxWidthPx: z
      .number()
      .int()
      .describe('The container width when fixed; 0 when fluid'),
    padding: spacing.describe('The page padding around the content'),
    align: z.enum(['start', 'center']),
    separation: separation.describe(
      'How the content area sets off from the frame: its own panel background, a border, a shadow, or nothing',
    ),
  });
  return {
    app: z.object({
      docksFirst: z
        .enum(['header', 'sidebars'])
        .describe(
          'header: the header and footer span the full width and the sidebar runs between them; sidebars: the sidebar runs the full height and the header and footer sit beside it',
        ),
      header: z.object(header),
      sidebar: Sidebar,
      footer: appFooter,
      main,
      logo: z
        .enum(['header', 'sidebar'])
        .describe("Where the app's logo sits: the header, or the top of the sidebar"),
      account: z
        .enum(['header', 'sidebar'])
        .describe("Where the account menu sits: the header's end, or the bottom of the sidebar"),
    }),
    // A site's logo always sits in its header.
    marketing: z.object({
      header: z.object({ ...header, sticky }),
      footer: marketingFooter,
      main,
      account: z
        .enum(['header', 'none'])
        .describe("The account menu, Sign in for a visitor, at the header's end; none for a site without accounts"),
    }),
  };
}
const anyLayouts = pageLayoutSchemas(z.string());
/** The layouts as the theme call writes them. */
export const CallLayouts = z.object(anyLayouts);
export type CallLayouts = z.infer<typeof CallLayouts>;
/** A built layout: the app's shape with the marketing header, either kind's footer and either kind's places, so PageLayout reads both alike. */
const Layout = anyLayouts.app.extend({
  header: anyLayouts.marketing.shape.header,
  footer: z.union([anyLayouts.app.shape.footer, anyLayouts.marketing.shape.footer]),
  logo: z.enum(['header', 'sidebar']),
  account: z.enum(['header', 'sidebar', 'none']),
});
export const Layouts = z.object({ app: Layout, marketing: Layout });
export type Layouts = z.infer<typeof Layouts>;

/** A footer's slots by name: a site's one `content`, or an app's `start`, `center` and `end`. */
export const footerSlots = (footer: Layouts['app']['footer']): Record<string, string> =>
  'content' in footer
    ? { content: footer.content }
    : { start: footer.start, center: footer.center, end: footer.end };

/** Per component: a value for each variant its recipe defaults, and its look. */
export type ComponentDefaults = Record<string, Record<string, string>>;

/** What the theme call returns: the brief first, then the values it becomes. */
export type ThemeCall = {
  brief: Brief;
  logo: Logo;
  colors: ModeSteps[];
  layouts: CallLayouts;
  defaults: ComponentDefaults;
};

export function makeThemeSchema(inv: Inventory): z.ZodType<ThemeCall> {
  const spacing = z
    .enum(spacingKeys(inv))
    .describe('A spacing token key: 4 means 16px');
  const layouts = pageLayoutSchemas(spacing);
  const defaults = inv.components.flatMap((component) => {
    const values: Record<string, z.ZodType<string>> = {};
    for (const prop of Object.keys(component.defaults ?? {})) {
      const options = component.variants[prop];
      if (options?.length)
        values[prop] = z.enum(options as [string, ...string[]]);
    }
    if (component.looks?.length)
      values.look = z.enum(component.looks as [string, ...string[]]);
    return Object.keys(values).length
      ? [[component.name, z.object(values)] as const]
      : [];
  });
  return z.object({
    brief: Brief,
    logo: Logo,
    colors: z
      .array(ModeSteps)
      .describe("Each mode the brief's color scheme names, once"),
    layouts: z.object(layouts),
    defaults: z.object(Object.fromEntries(defaults)),
  }) as unknown as z.ZodType<ThemeCall>;
}
