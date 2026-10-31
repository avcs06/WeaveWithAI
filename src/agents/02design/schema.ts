import { z } from 'zod';
import {
  dsNames,
  type Inventory,
  spacingKeys,
  typeScaleKeys,
} from '../../ds/inventory';
import { Question } from '../01flows/schema';
import {
  CONTENT_WIDTHS,
  NODE_ROLES,
  SCREEN_KINDS,
  SECTION_KINDS,
  STATES,
  SURFACES,
} from './config';
import { boxSchemas } from './schema-boxes';

// Every field is required; "none" is "", 0, [], null or `none`. Nesting stays
// within 8 levels (Meta allows 10). Spacing keys and type sizes are enums from
// the inventory, so a call cannot use a gap or a text size the design system
// does not have. A node says what it is in `what`, which the coding stage
// reads; `component` serves the validators and the layout skeleton and is
// stripped before the coding stage sees the node. `size` and `look` are ""
// for the theme's defaults, which the app applies everywhere; a node that
// overrides one says why, and only overrides reach the coding stage.

export type { NodeBox, NodeLayout, Region, Shell } from './schema-boxes';

export { SIZING } from './schema-boxes';

/**
 * The screens schema for an inventory: the IA of the assembled screens, one
 * screen's nodes, and the parts they are built from.
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
      .describe('Its id. In a widget: W03.n01. In a new component: TitleCover.n01. In a frame: SH1.n01. On an assembled screen: S03.n07'),
    section: z
      .string()
      .describe('The section it sits in, such as S03.sec2, or the shell region it sits in, such as SH1.r1'),
    parent: z
      .string()
      .describe('The id of the node it sits in. "" for a top-level node of its section'),
    order: z.number().int(),
    what: z
      .string()
      .describe(
        'What it is, in a short phrase an engineer maps to a component, with its size and look. Such as "a password input, size md", "a primary button", "the page title" or "a row of filter chips"',
      ),
    newComponent: z
      .string()
      .describe('The name of the declared new component it is. "" otherwise'),
    component: z
      .enum([...names, 'none'])
      .describe(
        'The design-system component it is. Code checks and lays out the design with it. none for a new component, plain text or a layout box',
      ),
    size: z
      .enum([...sizes, ''])
      .describe(
        '"" for the app\'s default. A size of the component only to override that default',
      ),
    look: z
      .string()
      .describe(
        '"" for the app\'s default. To override that default, a look the component lists, such as "ghost rounded", or base for the design system\'s plain look',
      ),
    overrideReason: z
      .string()
      .describe(
        'Why it sets its own size or look instead of the app\'s defaults. "" when it uses the defaults',
      ),
    box: Box,
    layout: Layout.nullable().describe(
      'How a container arranges its child nodes. null for a leaf, a node with no children',
    ),
    typeScale: z
      .enum([...typeScale, 'none'])
      .describe('The type size token of a text or a heading. none otherwise'),
    text: z.string().describe('The words it shows. "" for none'),
    label: z
      .string()
      .describe('The accessible name of an icon-only or ambiguous control. "" otherwise'),
    headingLevel: z
      .number()
      .int()
      .describe('The level of a heading, 1 to 4. 0 otherwise'),
    role: z.enum(NODE_ROLES),
    field: z
      .string()
      .describe('For an input, the name of the flow field it edits. "" otherwise'),
    data: z
      .array(z.string())
      .describe('The values it shows, as Noun.attribute, such as Project.name. [] for none'),
    flowSteps: z
      .array(z.string())
      .describe('The ids of the steps and alternatives it serves'),
    states: z
      .array(z.enum(STATES))
      .describe('The states in which it shows. ["default"] when it always shows'),
    navigatesTo: z
      .string()
      .describe('The id of the screen this action opens. "" for none'),
  });

  const Section = z.object({
    id: z.string().describe('S03.sec1, S03.sec2, ...'),
    screen: z.string(),
    order: z.number().int(),
    kind: z.enum(SECTION_KINDS),
    title: z.string(),
    purpose: z.string(),
    box: Box.describe(
      'Its size in the screen layout. A main section fills. A side panel is fixed, such as 280 wide',
    ),
    layout: Layout,
    surface: z
      .enum(SURFACES)
      .describe(
        'Its background: page for most; frame, brand or accent set a band apart on a marketing page',
      ),
    flowSteps: z.array(z.string()),
    in: z
      .string()
      .describe('The screen box it sits in, such as S04.b1. "" for the top of the screen'),
    share: z
      .number()
      .int()
      .describe('When its box fills, its share of the space left: 1, 2 and so on. 1 otherwise'),
  });

  const spacing = spacingKeys(inv);
  const IaScreen = z.object({
    id: z.string().describe('S01, S02, ...'),
    name: z.string(),
    type: z.enum(['page', 'dialog', 'drawer']),
    route: z
      .string()
      .describe(
        'A page\'s Next.js route, such as /projects/[projectId]. "" for a dialog or drawer',
      ),
    parent: z
      .string()
      .describe('The page that opens this dialog or drawer. "" for a page'),
    kind: z
      .enum(SCREEN_KINDS)
      .describe(
        'app: a screen where users do their tasks, sign in included. marketing: public content, such as a landing or pricing page',
      ),
    framed: z
      .boolean()
      .describe(
        "True for a page that sits in its kind's layout, with the layout's header, sidebars and footer. False for a page with no frame, such as sign in. Always false for a dialog or drawer",
      ),
    contentWidth: z
      .enum(CONTENT_WIDTHS)
      .describe(
        "The width of a page's column inside its layout's container: narrow 640, medium 960, wide 1280, or full for the whole container. For a dialog or drawer, its size",
      ),
    layout: Layout.extend({
      gap: z.enum([...spacing, '']),
      padding: z.enum([...spacing, '']),
    }).describe(
      'How its sections are arranged: a column, or a row or grid for a side panel beside the main content. A page leaves gap and padding "", because its layout sets them. A dialog or drawer gives the gap between its sections and its padding',
    ),
    access: z.enum(['public', 'signedIn']),
    roles: z.array(z.string()),
    purpose: z.string(),
    entry: z
      .boolean()
      .describe('True for a page a user can start from, such as the landing page, home and sign in'),
    states: z.array(z.enum(STATES)),
    flowSteps: z.array(z.string()),
  });


  // A new component is look only (DS23): its behavior, props, keyboard and ARIA are the coding stage's.
  const NewComponent = z.object({
    name: z
      .string()
      .describe('Its name in PascalCase. It differs from every design-system name'),
    purpose: z.string(),
    closestExisting: z
      .array(z.enum(names))
      .describe('The design-system components you considered'),
    whyNotExisting: z.string(),
    description: z
      .string()
      .describe(
        "What it shows, what it is for, how much it stands out, and how it should feel and look, in the theme's terms. Give one reference",
      ),
    minWidthPx: z.number().int(),
    maxWidthPx: z
      .number()
      .int()
      .describe('Its widest width in px. 0 to fill what it is given'),
    box: ComponentBox.describe('Its root box'),
    layout: Layout.describe('How its root arranges its nodes'),
    nodes: z.array(Node.omit({ section: true })),
    usedOn: z
      .array(z.string())
      .describe('The ids of the screens and shells that use it'),
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
    questions: z
      .array(Question)
      .describe('Questions about flows that are unclear, for reconciliation'),
    impossibleSteps: z.array(
      z.object({ step: z.string(), reason: z.string() }),
    ),
  });

  const ScreenNodes = z.object({
    screen: z.string().describe('The id of the screen or the shell these nodes fill'),
    nodes: z.array(Node),
  });
  /** A screen as the artifact holds it: its shell, and a page's gap and padding from its layout. */
  const Screen = IaScreen.extend({ shell: z.string(), layout: Layout });
  const Container = z.object({
    container: z.enum(['fluid', 'fixed']),
    maxWidthPx: z.number().int(),
    align: z.enum(['start', 'center']),
  });
  /** A box of a screen's tree (DS23): it holds boxes and sections in a row or a column. */
  const ScreenBox = z.object({
    id: z.string().describe('S04.b1, S04.b2, ...'),
    screen: z.string(),
    parent: z.string().describe('The box it sits in; "" at the top'),
    order: z.number().int(),
    box: Box,
    layout: Layout,
    share: z.number().int(),
  });
  const Screens = Ia.extend({
    screens: z.array(Screen),
    boxes: z.array(ScreenBox),
    containers: z.object({ app: Container, marketing: Container }),
    shells: z.array(Shell),
    /** How a screen's frame differs from its shell's default (DS23): frame nodes only it shows, and default nodes it leaves out. */
    frameChanges: z.array(
      z.object({
        screen: z.string(),
        add: z.array(z.string()),
        remove: z.array(z.string()),
      }),
    ),
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
    ScreenBox,
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

export type DesignBox = z.infer<Schemas['ScreenBox']>;

/**
 * `02-design/08-assemble.json`: the IA with each screen's shell and a page's gap and
 * padding filled in, the containers and shells made from the theme's
 * layouts, and the nodes of every screen and shell region.
 */
export type Screens = z.infer<Schemas['Screens']>;
