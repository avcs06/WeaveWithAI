import { z } from 'zod';
import {
  CONTENT_WIDTHS,
  NODE_ROLES,
  SCREEN_TEMPLATES,
  SECTION_KINDS,
  STATES,
} from '../../config/design';
import {
  dsNames,
  type Inventory,
  spacingKeys,
  typeScaleKeys,
} from '../../ds/inventory';
import { Question } from '../flows/schema';

// Every field is required; "none" is "", 0, [], null or `none`. Nesting stays
// within 8 levels (Meta allows 10). Spacing keys and type sizes are enums from
// the inventory, so a call cannot use a gap or a text size the design system
// does not have. A node says what it is in `what`, which the coding stage
// reads; `component`, `size` and `look` serve the validators and the layout
// skeleton and are stripped before the coding stage sees the node.

export const SIZING = ['fill', 'content', 'fixed'] as const;

/**
 * The screens schema for an inventory: the IA call's shape, one screen's
 * nodes, and the parts they are built from.
 */
export function makeScreensSchema(inv: Inventory) {
  const names = dsNames(inv);
  const spacing = spacingKeys(inv);
  const typeScale = typeScaleKeys(inv);
  const sizes = [
    ...new Set(inv.components.flatMap((c) => c.variants.size ?? [])),
  ].sort();

  const Box = z.object({
    width: z
      .enum(SIZING)
      .describe('fill the parent, size to the content, or a fixed px width'),
    widthPx: z.number().int().describe('Only when width is fixed; 0 otherwise'),
    height: z
      .enum(SIZING)
      .describe(
        'A design-system component has its height from the inventory: say content',
      ),
    heightPx: z.number().int().describe('Only when height is fixed; 0 otherwise'),
    minHeightPx: z.number().int().describe('0 for none'),
    span: z
      .number()
      .int()
      .describe('Grid columns this node spans in a grid parent; 1 otherwise'),
  });

  const Layout = z.object({
    direction: z.enum(['row', 'column', 'grid']),
    gap: z
      .enum(spacing)
      .describe('A spacing token key between the children: 4 means 16px'),
    padding: z
      .enum(spacing)
      .describe('A spacing token key inside the box, all sides; 0 for none'),
    columns: z
      .number()
      .int()
      .describe('Grid columns on desktop, 1 to 4; 0 for row and column'),
    align: z
      .enum(['start', 'center', 'end', 'stretch'])
      .describe('Children across the direction'),
    justify: z
      .enum(['start', 'center', 'end', 'between'])
      .describe('Children along the direction'),
    wrap: z.boolean().describe('A row that wraps when its children do not fit'),
  });

  /** A new component's root or part: a box with its own padding and gap. */
  const ComponentBox = Box.omit({ span: true }).extend({
    padding: z.enum(spacing),
    gap: z.enum(spacing),
  });

  const Node = z.object({
    id: z.string().describe('S03.n07'),
    section: z.string().describe('S03.sec2'),
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
      .describe('The component\'s size, when it has sizes; ""'),
    look: z
      .string()
      .describe('A look the component lists, e.g. "ghost rounded"; ""'),
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
    layout: Layout,
    flowSteps: z.array(z.string()),
  });

  const Screen = z.object({
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
    template: z.enum(SCREEN_TEMPLATES),
    contentWidth: z
      .enum(CONTENT_WIDTHS)
      .describe('The content column: narrow 640, medium 960, wide 1280, full'),
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
        'How the parts are arranged and sized, in sentences with the numbers, at desktop and on a phone',
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
    usedOn: z.array(z.string()).describe('Screen IDs'),
  });

  const Ia = z.object({
    navigation: z.object({
      model: z.enum(['top-bar', 'sidebar', 'bottom-tabs', 'none']),
      items: z.array(
        z.object({
          label: z.string(),
          screen: z.string(),
          access: z.enum(['public', 'signedIn']),
        }),
      ),
    }),
    screens: z.array(Screen),
    sections: z.array(Section),
    newComponents: z.array(NewComponent),
    questions: z.array(Question).describe('Unclear flows, for reconciliation'),
    impossibleSteps: z.array(
      z.object({ step: z.string(), reason: z.string() }),
    ),
  });

  const ScreenNodes = z.object({ screen: z.string(), nodes: z.array(Node) });

  return { Ia, ScreenNodes, Node, Section, Screen, NewComponent, Box, Layout };
}

type Schemas = ReturnType<typeof makeScreensSchema>;
export type Ia = z.infer<Schemas['Ia']>;
export type ScreenNodes = z.infer<Schemas['ScreenNodes']>;
export type DesignNode = z.infer<Schemas['Node']>;
export type DesignSection = z.infer<Schemas['Section']>;
export type DesignScreen = z.infer<Schemas['Screen']>;
export type NewComponent = z.infer<Schemas['NewComponent']>;
export type NodeBox = z.infer<Schemas['Box']>;
export type NodeLayout = z.infer<Schemas['Layout']>;

/** `02-screens.json`: the IA plus every screen's nodes. */
export type Screens = Ia & { nodes: DesignNode[] };
