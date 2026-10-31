import { z } from 'zod';
import { REGION_PLACES } from './config';
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
      .describe(
        'Its width. fill: fills its parent. content: as wide as its content. fixed: widthPx wide',
      ),
    widthPx: z
      .number()
      .int()
      .describe('Its width in px when width is fixed. 0 otherwise'),
    height: z
      .enum(SIZING)
      .describe(
        'Its height. A design-system component takes content, because the design system sets its height',
      ),
    heightPx: z
      .number()
      .int()
      .describe('Its height in px when height is fixed. 0 otherwise'),
    minHeightPx: z
      .number()
      .int()
      .describe('Its minimum height in px. 0 for none'),
    span: z
      .number()
      .int()
      .describe('The grid columns it spans when its parent is a grid. 1 otherwise'),
  });

  const Layout = z.object({
    direction: z.enum(['row', 'column', 'grid']),
    gap: z
      .enum(spacing)
      .describe('The space between its children, as a spacing token key. 4 means 16px'),
    padding: z
      .enum(spacing)
      .describe('The space inside its edge on every side, as a spacing token key. 0 for none'),
    columns: z
      .number()
      .int()
      .describe('For a grid, its columns on desktop, 1 to 4. 0 for a row or a column'),
    align: z
      .enum(['start', 'center', 'end', 'stretch'])
      .describe('Where its children sit across its direction'),
    justify: z
      .enum(['start', 'center', 'end', 'between'])
      .describe('Where its children sit along its direction'),
    wrap: z
      .boolean()
      .describe('True for a row whose children wrap to a new line when they do not fit'),
  });

  /** A new component's root or part: a box with its own padding and gap. */
  const ComponentBox = Box.omit({ span: true }).extend({
    padding: z.enum(spacing),
    gap: z.enum(spacing),
  });

  const Region = z.object({
    id: z.string().describe('SH1.r1, SH1.r2, ...'),
    place: z
      .enum(REGION_PLACES)
      .describe(
        'The edge it docks to. Regions dock in order, each in the space the regions before it leave. So a top region that docks first spans the whole width, and a left region that docks first runs the whole height',
      ),
    overlay: z
      .boolean()
      .describe(
        'True for a top region drawn over the page instead of above it, such as a header over a hero. The page content starts under it',
      ),
    box: Box.omit({ span: true }).describe(
      'Its size. A top or bottom region fills the width and has a fixed or content height. A left or right region has a fixed width and fills the height',
    ),
    layout: Layout,
    holds: z
      .string()
      .describe(
        'What it holds, in one sentence, such as "the wordmark, the main navigation, the account menu"',
      ),
  });

  const Shell = z.object({
    id: z.string().describe('SH1, SH2, ...'),
    name: z.string().describe('A short name, such as app or marketing'),
    purpose: z.string().describe('The pages it frames, and why it suits them'),
    regions: z.array(Region),
  });

  return { Box, Layout, ComponentBox, Region, Shell };
}

type Schemas = ReturnType<typeof boxSchemas>;
export type NodeBox = z.infer<Schemas['Box']>;
export type NodeLayout = z.infer<Schemas['Layout']>;
export type Region = z.infer<Schemas['Region']>;
export type Shell = z.infer<Schemas['Shell']>;
