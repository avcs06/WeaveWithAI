import { z } from 'zod';
import { REGION_PLACES } from '../../config/design';
import { type Inventory, spacingKeys } from '../../ds/inventory';

// The geometry every design artifact shares: a box sizes something in its
// parent, a layout arranges its children, and a shell frames the pages that
// use it with regions docked to their edges. Spacing keys come from the
// inventory, so a call cannot use a gap the design system does not have.

export const SIZING = ['fill', 'content', 'fixed'] as const;

/** Box, layout and shell schemas for an inventory. */
export function boxSchemas(inv: Inventory) {
  const spacing = spacingKeys(inv);

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
    heightPx: z
      .number()
      .int()
      .describe('Only when height is fixed; 0 otherwise'),
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

  const Region = z.object({
    id: z.string().describe('SH1.r1'),
    place: z
      .enum(REGION_PLACES)
      .describe(
        'The edge it docks to. Regions dock in order, each on the space the ones before it left: a top region first spans the whole width, a left region first runs the whole height',
      ),
    overlay: z
      .boolean()
      .describe(
        'A top region drawn over the page instead of above it, such as a header on a hero; the content starts under it',
      ),
    box: Box.omit({ span: true }).describe(
      'A top or bottom region fills the width with a fixed or content height; a left or right region has a fixed width and fills the height',
    ),
    layout: Layout,
    holds: z
      .string()
      .describe(
        'What it holds, in a sentence: "the wordmark, the main navigation, the account menu"',
      ),
  });

  const Shell = z.object({
    id: z.string().describe('SH1'),
    name: z.string().describe('A short name, e.g. app or marketing'),
    purpose: z.string().describe('The pages it frames and why it suits them'),
    regions: z.array(Region),
  });

  return { Box, Layout, ComponentBox, Region, Shell };
}

type Schemas = ReturnType<typeof boxSchemas>;
export type NodeBox = z.infer<Schemas['Box']>;
export type NodeLayout = z.infer<Schemas['Layout']>;
export type Region = z.infer<Schemas['Region']>;
export type Shell = z.infer<Schemas['Shell']>;
