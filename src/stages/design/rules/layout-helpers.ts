import type { Inventory } from '../../../ds/inventory';
import { typeScaleKeys } from '../../../ds/inventory';
import type { Rect, Skeleton } from '../layout';
import type {
  DesignNode,
  DesignScreen,
  DesignSection,
  NodeLayout,
  Screens,
} from '../schema';

// What the layout rules (LAYOUT-0NN, specs/layout-heuristics.md) read: one
// view per screen over the skeleton, with the nodes, sections and spacing
// behind each rectangle.

export type View = {
  screen: DesignScreen;
  width: number;
  height: number;
  rects: Rect[];
  rect: (id: string) => Rect | undefined;
  /** The rectangles under one, in order. */
  kids: (id: string) => Rect[];
  node: (id: string) => DesignNode | undefined;
  section: (id: string) => DesignSection | undefined;
  /** The layout a rectangle arranges its children with: its node's, its section's or region's, or the screen's for the content. */
  layout: (rect: Rect) => NodeLayout | null;
  /** A rectangle's own layout gap in px; 0 without a layout. */
  gap: (rect: Rect) => number;
};

export type LayoutInput = {
  screens: Screens;
  views: View[];
  /** Spacing key to px. */
  px: (key: string) => number;
  /** Type scale key to its rank (display 0, title 1 ...) and its font size. */
  rank: (scale: string) => number;
  fontPx: (scale: string) => number;
  /** The clearance a focus ring needs: ring gap, width and blur, at least 6. */
  ringPx: number;
};

const RING_PX = { halo: 3, offset: 4, glow: 10 } as Record<string, number>;

export function layoutInput(
  screens: Screens,
  skeleton: Skeleton,
  inv: Inventory,
): LayoutInput {
  const token = (name: string) =>
    Number.parseFloat(inv.tokens.find((t) => t.name === name)?.value ?? '') ||
    0;
  const px = (key: string) => token(`spacing.${key}`);
  const nodes = new Map(screens.nodes.map((node) => [node.id, node]));
  const sections = new Map(screens.sections.map((s) => [s.id, s]));
  const regions = new Map(
    screens.shells.flatMap((shell) => shell.regions.map((r) => [r.id, r])),
  );
  const views = skeleton.screens.flatMap(({ id, rects }): View[] => {
    const screen = screens.screens.find((s) => s.id === id);
    if (!screen) return [];
    const byId = new Map(rects.map((rect) => [rect.id, rect]));
    const kids = new Map<string, Rect[]>();
    for (const rect of rects)
      kids.set(rect.parent, [...(kids.get(rect.parent) ?? []), rect]);
    const layout = (rect: Rect) =>
      nodes.get(rect.id)?.layout ??
      sections.get(rect.id)?.layout ??
      regions.get(rect.id)?.layout ??
      (rect.id === `${screen.id}.content` ? screen.layout : null);
    return [
      {
        screen,
        width: skeleton.viewport.width,
        height: skeleton.viewport.height,
        rects,
        rect: (id) => byId.get(id),
        kids: (id) => kids.get(id) ?? [],
        node: (id) => nodes.get(id),
        section: (id) => sections.get(id),
        layout,
        gap: (rect) => {
          const own = layout(rect);
          return own ? px(own.gap) : 0;
        },
      },
    ];
  });
  const scale = typeScaleKeys(inv);
  return {
    screens,
    views,
    px,
    rank: (key) => scale.indexOf(key as (typeof scale)[number]),
    fontPx: (key) => token(`fontSize.${key}`),
    ringPx: Math.max(6, RING_PX[inv.project.focusRing.value] ?? 6),
  };
}

export const INTERACTIVE = new Set([
  'primary-action',
  'secondary-action',
  'destructive-action',
  'navigation',
  'input',
]);
export const ACTIONS = new Set([
  'primary-action',
  'secondary-action',
  'destructive-action',
]);
const BUTTONS = new Set(['Button', 'IconButton', 'PopoverButton']);
/** Controls whose sizes are the control scale, sm beside md. */
const SIZED = new Set([
  ...BUTTONS,
  'Chip',
  'Input',
  'NumberInput',
  'PasswordInput',
  'SearchInput',
  'Select',
  'MultiSelect',
  'Textarea',
]);
/** Components that draw a border or a surface around what they hold. */
export const BORDERED = new Set(['Card', 'Section', 'Accordion', 'Popover']);

export const isButton = (node: DesignNode | undefined) =>
  Boolean(node && BUTTONS.has(node.component));
export const isSized = (node: DesignNode | undefined) =>
  Boolean(node && SIZED.has(node.component) && node.size);
export const isHeading = (node: DesignNode | undefined) =>
  node?.role === 'heading';
export const isColumn = (layout: NodeLayout | null) =>
  !layout || layout.direction === 'column';

export const words = (text: string) =>
  text.trim().split(/\s+/).filter(Boolean).length;
export const sentences = (text: string) =>
  text.split(/[.!?](\s|$)/).filter((part) => part.trim().length > 1).length;

/**
 * The leaves that start a line in a column box: every child of a column,
 * the first child of a row, the first column of a grid; centred columns are
 * their own blocks (H-19) and are left out.
 */
export function lineStarts(view: View, rect: Rect): Rect[] {
  const kids = view.kids(rect.id);
  if (!kids.length) return [rect];
  const layout = view.layout(rect);
  // In a row, align is vertical; only a centred or end-aligned column is its own block.
  const column = !layout || layout.direction === 'column';
  if (column && (layout?.align === 'center' || layout?.align === 'end'))
    return [];
  const starts =
    layout?.direction === 'row'
      ? kids.slice(0, 1)
      : layout?.direction === 'grid'
        ? kids.filter((kid) => Math.abs(kid.x - (kids[0]?.x ?? 0)) < 0.5)
        : kids;
  return starts.flatMap((kid) => lineStarts(view, kid));
}
