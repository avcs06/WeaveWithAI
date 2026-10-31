import {
  arrange,
  type Ctx,
  type Item,
  type RectKind,
  round,
  type Solved,
} from './arrange';
import {
  chrome,
  leafHeight,
  leafPadding,
  leafWidth,
  NO_PADDING,
  type Padding,
  type Sizes,
} from './boxes';
import type { NodeLayout } from '../../schema-boxes';

// Sizes each item of the tree (DS6b): a leaf from the inventory, its text or
// its box; a container from its children inside its chrome and padding.
// Then lays the solved tree out as absolute rectangles.

export type Rect = {
  id: string;
  kind: RectKind;
  parent: string;
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /** "inventory Button sm", "fixed", "text 2 lines", "children". */
  heightFrom: string;
  estimated: boolean;
  /** To the previous sibling along the parent's direction; the first of a later line measures from the line above; null for the first. */
  gapBefore: number | null;
  padding: Padding;
  overflowX: boolean;
  what: string;
  /** Estimated lines of a text rectangle; 0 otherwise. */
  lines: number;
};

const COLUMN: NodeLayout = {
  direction: 'column',
  gap: '0',
  padding: '0',
  columns: 0,
  align: 'stretch',
  justify: 'start',
  wrap: false,
};
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

function insets(item: Item, ctx: Ctx) {
  const own = item.layout ? ctx.spacing(item.layout.padding) : 0;
  const outer =
    item.node && item.children.length
      ? chrome(item.node, ctx)
      : { padding: NO_PADDING, band: 0, estimated: false };
  const padding = outer.padding.map((side) => side + own) as Padding;
  return { padding, band: outer.band, estimated: outer.estimated };
}

/** The width an item wants, at most `limit`: fixed, or its content's. */
function natural(item: Item, limit: number, ctx: Ctx): number {
  if (item.box.width === 'fixed') return Math.min(item.box.widthPx, limit);
  if (!item.children.length)
    return item.node ? Math.min(leafWidth(item.node, ctx).width, limit) : limit;
  const [, right, , left] = insets(item, ctx).padding;
  const layout = item.layout ?? COLUMN;
  const inner = Math.max(0, limit - left - right);
  const widths = item.children.map((child) => natural(child, inner, ctx));
  const gap = ctx.spacing(layout.gap);
  const content =
    layout.direction === 'row'
      ? sum(widths) + gap * (widths.length - 1)
      : layout.direction === 'grid'
        ? inner
        : Math.max(...widths);
  return Math.min(left + right + content, limit);
}

function solveLeaf(item: Item, width: number, ctx: Ctx): Solved {
  const base = { item, width, overflowX: false, children: [] };
  if (!item.node) {
    const padding = insets(item, ctx).padding;
    const height = Math.max(padding[0] + padding[2], item.box.minHeightPx);
    return {
      ...base,
      height,
      from: 'empty',
      estimated: false,
      padding,
      lines: 0,
    };
  }
  const height = leafHeight(item.node, width, ctx);
  const widthGuessed =
    item.box.width === 'content' && leafWidth(item.node, ctx).estimated;
  return {
    ...base,
    height: height.height,
    from: height.from,
    estimated: height.estimated || widthGuessed,
    padding: leafPadding(item.node, ctx),
    lines: item.kind === 'text' ? height.lines : 0,
  };
}

function solve(item: Item, width: number, ctx: Ctx): Solved {
  if (!item.children.length) return solveLeaf(item, width, ctx);
  const { padding, band, estimated } = insets(item, ctx);
  const [top, right, bottom, left] = padding;
  const fixed = item.box.height === 'fixed' ? item.box.heightPx : undefined;
  const arranged = arrange(
    item.children,
    Math.max(0, width - left - right),
    item.layout ?? COLUMN,
    ctx,
    fixed === undefined ? undefined : fixed - top - bottom - band,
  );
  let height = fixed ?? top + band + arranged.height + bottom;
  let from = fixed === undefined ? 'children' : 'fixed';
  if (item.box.minHeightPx > height) {
    height = item.box.minHeightPx;
    from += `, raised to min ${height}`;
  }
  const children = arranged.placed.map((child) => ({
    ...child,
    x: child.x + left,
    y: child.y + top + band,
  }));
  return {
    item,
    width,
    height,
    from,
    estimated: estimated || children.some((child) => child.estimated),
    padding,
    lines: 0,
    overflowX: arranged.overflowX,
    children,
  };
}

/** The solver's context: the sizes and its own sizing functions. */
export function context(s: Sizes): Ctx {
  const ctx: Ctx = {
    ...s,
    solve: (item, width) => solve(item, width, ctx),
    natural: (item, limit) => natural(item, limit, ctx),
  };
  return ctx;
}

export function emit(
  solved: Solved,
  at: { x: number; y: number; gapBefore: number | null },
  parent: string,
  depth: number,
  out: Rect[],
): void {
  const { item } = solved;
  out.push({
    id: item.id,
    kind: item.kind,
    parent,
    depth,
    x: round(at.x),
    y: round(at.y),
    width: round(solved.width),
    height: round(solved.height),
    heightFrom: solved.from,
    estimated: solved.estimated,
    gapBefore: at.gapBefore === null ? null : round(at.gapBefore),
    padding: solved.padding,
    overflowX: solved.overflowX,
    what: item.what,
    lines: solved.lines,
  });
  for (const child of solved.children)
    emit(
      child,
      { x: at.x + child.x, y: at.y + child.y, gapBefore: child.gapBefore },
      item.id,
      depth + 1,
      out,
    );
}
