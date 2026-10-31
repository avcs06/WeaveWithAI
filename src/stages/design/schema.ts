import { z } from 'zod';
import {
  CONTENT_WIDTHS,
  NODE_ROLES,
  SCREEN_KINDS,
  SECTION_KINDS,
  STATES,
  SURFACES,
} from '../../config/design';
import {
  dsNames,
  type Inventory,
  spacingKeys,
  typeScaleKeys,
} from '../../ds/inventory';
import { DISPLAY_FONTS, MONO_FONTS, UI_FONTS } from '../../config/fonts';
import { Question } from '../flows/schema';
import { boxSchemas } from './schema-boxes';

export type { NodeBox, NodeLayout, Region, Shell } from './schema-boxes';
export { SIZING } from './schema-boxes';

// Every field is required; "none" is "", 0, [], null or `none`. Nesting stays
// within 8 levels (Meta allows 10). Spacing keys and type sizes are enums from
// the inventory, so a call cannot use a gap or a text size the design system
// does not have. A node says what it is in `what`, which the coding stage
// reads; `component` serves the validators and the layout skeleton and is
// stripped before the coding stage sees the node. `size` and `look` are ""
// for the theme's defaults, which the app applies everywhere; a node that
// overrides one says why, and only overrides reach the coding stage.

/** How tinted a surface is; the brand color itself is never neutral. */
const SURFACE_CHROMA = ['neutral', 'muted', 'balanced', 'vivid'] as const;
/** How tinted the base set is; it carries most components, so never vivid. */
const BASE_CHROMA = ['neutral', 'muted', 'balanced'] as const;

/**
 * The design direction the brief call picks, once per app; the theme call
 * turns it into exact values.
 */
export const Brief = z.object({
  audience: z.string(),
  personality: z
    .array(z.string())
    .describe('3 to 5 adjectives for the look and feel'),
  voice: z
    .string()
    .describe('Tone of the copy, e.g. "plain, warm, second person"'),
  density: z.enum(['compact', 'comfortable', 'spacious']),
  feel: z
    .array(z.string())
    .describe('1 or 2 words for the site\'s style, e.g. minimal, retro'),
  colorScheme: z.enum(['light', 'dark', 'both']),
  seedHue: z
    .number()
    .describe('Brand hue as a number of degrees on the color wheel, 0 to 360'),
  seedChroma: z.enum(['muted', 'balanced', 'vivid']),
  pageHue: z
    .number()
    .describe('Hue of the page background, OKLCH degrees, 0 to 360'),
  pageChroma: z
    .enum(SURFACE_CHROMA)
    .describe(
      'neutral is white or grey with no tint, muted a faint tint, balanced and vivid a clear color',
    ),
  frameHue: z
    .number()
    .describe(
      'Hue of the header, sidebars and footer, OKLCH degrees, 0 to 360',
    ),
  frameChroma: z.enum(SURFACE_CHROMA),
  baseHue: z
    .number()
    .describe(
      'Hue of the base set most components use (secondary buttons, inputs, cards, tables, menus), OKLCH degrees, 0 to 360',
    ),
  baseChroma: z
    .enum(BASE_CHROMA)
    .describe('neutral is grey with no tint, muted a faint tint, balanced a clear one'),
  fonts: z.object({
    ui: z.enum(UI_FONTS),
    display: z.enum(DISPLAY_FONTS),
    mono: z.enum(MONO_FONTS),
  }),
  radius: z.enum(['sharp', 'soft', 'round', 'pill']),
  focusRing: z.enum(['halo', 'offset', 'glow']),
  entities: z
    .array(
      z.object({
        noun: z.string().describe('A noun from the scope vocabulary'),
        colored: z
          .boolean()
          .describe('True when users must tell its records apart at a glance'),
        hue: z.number().describe('Degrees, 0 to 360, when colored; 0 if not'),
      }),
    )
    .describe('Every noun of the scope vocabulary once; at most 3 colored'),
  imagery: z.enum(['none', 'icons', 'illustrations']),
  references: z
    .array(z.string())
    .describe('Style references named in the idea; []'),
});
export type Brief = z.infer<typeof Brief>;

/**
 * The screens schema for an inventory: the IA call's shape, one screen's
 * nodes, and the parts they are built from.
 */
export function makeScreensSchema(inv: Inventory) {
  const names = dsNames(inv);
  const typeScale = typeScaleKeys(inv);
  const sizes = [
    ...new Set(inv.components.flatMap((c) => c.variants.size ?? [])),
  ].sort();
  const { Box, Layout, ComponentBox, Shell } = boxSchemas(inv);

  const Node = z.object({
    id: z
      .string()
      .describe('S03.n07; a node of a shell region is SH1.n01'),
    section: z
      .string()
      .describe('S03.sec2, or the shell region it sits in, SH1.r1'),
    parent: z
      .string()
      .describe('Parent node ID; "" for a top-level node of the section'),
    order: z.number().int(),
    what: z
      .string()
      .describe(
        'What this is, in a short phrase an engineer maps to a component, with its size and look: "a password input, size md", "a primary button", "the page title", "a row of filter chips"',
      ),
    newComponent: z
      .string()
      .describe('The declared new component this node is, by name; ""'),
    component: z
      .enum([...names, 'none'])
      .describe(
        'The design-system component this is, for validation and layout; none for a new component, plain text or a layout box',
      ),
    size: z
      .enum([...sizes, ''])
      .describe('"" for the app\'s default; a size of the component only to override it'),
    look: z
      .string()
      .describe(
        '"" for the app\'s default; a look the component lists, e.g. "ghost rounded", or base for the design system\'s plain look, only to override it',
      ),
    overrideReason: z
      .string()
      .describe(
        'Why this node sets its own size or look instead of the app\'s defaults; "" when it uses them',
      ),
    box: Box,
    layout: Layout.nullable().describe(
      'For a container with child nodes; null for a leaf',
    ),
    typeScale: z
      .enum([...typeScale, 'none'])
      .describe('For text and headings, the type size token; none otherwise'),
    text: z.string().describe('Visible copy; ""'),
    label: z
      .string()
      .describe('Accessible name for icon-only or ambiguous controls; ""'),
    headingLevel: z.number().int().describe('1 to 4 for headings; 0 otherwise'),
    role: z.enum(NODE_ROLES),
    field: z.string().describe('Name of the flow field this input edits; ""'),
    data: z
      .array(z.string())
      .describe('Values shown, as Noun.attribute, e.g. Project.name; []'),
    flowSteps: z
      .array(z.string())
      .describe('Step and alternative IDs this node serves'),
    states: z
      .array(z.enum(STATES))
      .describe('States in which it shows; ["default"] if always'),
    navigatesTo: z.string().describe('Screen ID this action opens; ""'),
  });

  const Section = z.object({
    id: z.string().describe('S03.sec1'),
    screen: z.string(),
    order: z.number().int(),
    kind: z.enum(SECTION_KINDS),
    title: z.string(),
    purpose: z.string(),
    box: Box.describe(
      'Its size in the screen layout: a main section fills, a side panel is fixed, e.g. 280 wide',
    ),
    layout: Layout,
    surface: z
      .enum(SURFACES)
      .describe(
        'Its background: page for most; frame, brand or accent set a band apart on a marketing page',
      ),
    flowSteps: z.array(z.string()),
  });

  const spacing = spacingKeys(inv);
  const IaScreen = z.object({
    id: z.string().describe('S01'),
    name: z.string(),
    type: z.enum(['page', 'dialog', 'drawer']),
    route: z
      .string()
      .describe(
        'Next.js route for pages, e.g. /projects/[projectId]; "" otherwise',
      ),
    parent: z
      .string()
      .describe('Page that opens this dialog or drawer; "" for pages'),
    kind: z
      .enum(SCREEN_KINDS)
      .describe(
        'app: a task screen, sign in included; marketing: public content such as a landing or pricing page',
      ),
    framed: z
      .boolean()
      .describe(
        "True for a page in its kind's layout, with its header, sidebars and footer; false for a page with no frame, such as sign in, and always for dialogs and drawers",
      ),
    contentWidth: z
      .enum(CONTENT_WIDTHS)
      .describe(
        "A page's column inside its layout's container: narrow 640, medium 960, wide 1280, full the container; a dialog's or drawer's size",
      ),
    layout: Layout.extend({
      gap: z.enum([...spacing, '']),
      padding: z.enum([...spacing, '']),
    }).describe(
      'How its sections are arranged: a column, or a row or grid for a side panel beside the main content. A page leaves gap and padding "": its layout sets them. A dialog or drawer gives the gap between sections and its padding',
    ),
    access: z.enum(['public', 'signedIn']),
    roles: z.array(z.string()),
    purpose: z.string(),
    entry: z
      .boolean()
      .describe('True for pages a user can start from: landing, home, sign in'),
    states: z.array(z.enum(STATES)),
    flowSteps: z.array(z.string()),
  });

  const Part = z.object({
    name: z.string().describe('camelCase, becomes its data-slot'),
    description: z.string(),
    box: ComponentBox,
  });

  const NewComponent = z.object({
    name: z.string().describe('PascalCase; must not be a design-system name'),
    purpose: z.string(),
    closestExisting: z
      .array(z.enum(names))
      .describe('Design-system components you considered'),
    whyNotExisting: z.string(),
    composedOf: z
      .array(z.string())
      .describe('Design-system components and tokens it builds on'),
    box: ComponentBox.describe('The root box'),
    parts: z.array(Part),
    layout: z
      .string()
      .describe(
        'How the parts are arranged and sized, in sentences with the numbers',
      ),
    behavior: z
      .string()
      .describe(
        'What the user can do with pointer and keyboard, every state and transition, and what each action calls: full sentences for the engineer who builds it',
      ),
    props: z.array(
      z.object({ name: z.string(), type: z.string(), description: z.string() }),
    ),
    states: z.array(z.string()),
    keyboard: z.array(z.object({ key: z.string(), action: z.string() })),
    ariaPattern: z
      .string()
      .describe(
        'WAI-ARIA pattern, e.g. grid, listbox, disclosure; "none" if static',
      ),
    usedOn: z.array(z.string()).describe('Screen or shell IDs'),
  });

  const Ia = z.object({
    navigation: z.object({
      items: z.array(
        z.object({
          label: z.string(),
          screen: z.string(),
          access: z.enum(['public', 'signedIn']),
        }),
      ),
    }),
    screens: z.array(IaScreen),
    sections: z.array(Section),
    newComponents: z.array(NewComponent),
    questions: z.array(Question).describe('Unclear flows, for reconciliation'),
    impossibleSteps: z.array(
      z.object({ step: z.string(), reason: z.string() }),
    ),
  });

  const ScreenNodes = z.object({
    screen: z.string().describe('The screen, or the shell, these nodes fill'),
    nodes: z.array(Node),
  });
  /** A screen as the artifact holds it: its shell, and a page's gap and padding from its layout. */
  const Screen = IaScreen.extend({ shell: z.string(), layout: Layout });
  const Container = z.object({
    container: z.enum(['fluid', 'fixed']),
    maxWidthPx: z.number().int(),
    align: z.enum(['start', 'center']),
  });
  const Screens = Ia.extend({
    screens: z.array(Screen),
    containers: z.object({ app: Container, marketing: Container }),
    shells: z.array(Shell),
    nodes: z.array(Node),
  });

  return {
    Ia,
    ScreenNodes,
    Screens,
    Node,
    Section,
    IaScreen,
    Screen,
    NewComponent,
    Box,
    Layout,
    Shell,
  };
}

type Schemas = ReturnType<typeof makeScreensSchema>;
export type Ia = z.infer<Schemas['Ia']>;
export type ScreenNodes = z.infer<Schemas['ScreenNodes']>;
export type DesignNode = z.infer<Schemas['Node']>;
export type DesignSection = z.infer<Schemas['Section']>;
export type DesignScreen = z.infer<Schemas['Screen']>;
export type NewComponent = z.infer<Schemas['NewComponent']>;

/**
 * `02-screens.json`: the IA with each screen's shell and a page's gap and
 * padding filled in, the containers and shells made from the theme's
 * layouts, and the nodes of every screen and shell region.
 */
export type Screens = z.infer<Schemas['Screens']>;
