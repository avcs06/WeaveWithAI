import { FILL_BASIS_PX } from '../../config/design';
import type { Padding, Sizes } from './layout-boxes';
import type { DesignNode, NodeBox, NodeLayout } from './schema';

// How a container places its children in a column, a row or a grid (DS6b).
// Sizing calls back into the solver (layout-solve.ts) through the context.

export type RectKind =
  'frame' | 'section' | 'container' | 'component' | 'newComponent' | 'text';

/** A section, node or frame box in the tree the solver walks. */
export type Item = {
  id: string;
  kind: RectKind;
  what: string;
  box: NodeBox;
  layout: NodeLayout | null;
  node?: DesignNode;
  children: Item[];
};
export type Solved = {
  item: Item;
  width: number;
  height: number;
  from: string;
  estimated: boolean;
  padding: Padding;
  lines: number;
  overflowX: boolean;
  children: Placed[];
};
export type Placed = Solved & {
  x: number;
  y: number;
  gapBefore: number | null;
};
type Arranged = { placed: Placed[]; height: number; overflowX: boolean };
/** The sizes and the solver's sizing functions. */
export type Ctx = Sizes & {
  solve: (item: Item, width: number) => Solved;
  natural: (item: Item, limit: number) => number;
};

const EPSILON = 0.01;
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
export const round = (value: number) => Math.round(value * 100) / 100;
const widthIn = (item: Item, available: number, ctx: Ctx) =>
  item.box.width === 'fill' ? available : ctx.natural(item, available);

const offset = (align: NodeLayout['align'], space: number, size: number) =>
  align === 'center' ? (space - size) / 2 : align === 'end' ? space - size : 0;

/** Along the direction: the start offset and the extra gap that `justify` gives the leftover. */
function spread(
  justify: NodeLayout['justify'],
  leftover: number,
  count: number,
) {
  const free = Math.max(0, leftover);
  if (justify === 'center') return { start: free / 2, extra: 0 };
  if (justify === 'end') return { start: free, extra: 0 };
  if (justify === 'between' && count > 1)
    return { start: 0, extra: free / (count - 1) };
  return { start: 0, extra: 0 };
}

/** A filling height takes the line; with align stretch, containers do too. */
function stretch(
  solved: Solved,
  line: number,
  align: NodeLayout['align'],
): Solved {
  const fills = solved.item.box.height === 'fill';
  const container = align === 'stretch' && solved.children.length > 0;
  if (!(fills || container) || solved.height >= line) return solved;
  return {
    ...solved,
    height: line,
    from: `${solved.from}, stretched to ${round(line)}`,
  };
}

function arrangeColumn(
  items: Item[],
  inner: number,
  layout: NodeLayout,
  ctx: Ctx,
  innerHeight?: number,
): Arranged {
  const gap = ctx.spacing(layout.gap);
  let solved = items.map((item) => ctx.solve(item, widthIn(item, inner, ctx)));
  const total = () =>
    sum(solved.map((s) => s.height)) + gap * (solved.length - 1);
  const fills = solved.filter((s) => s.item.box.height === 'fill').length;
  if (innerHeight !== undefined && fills) {
    const share = Math.max(0, innerHeight - total()) / fills;
    solved = solved.map((s) =>
      s.item.box.height === 'fill'
        ? { ...s, height: s.height + share, from: `${s.from}, filled` }
        : s,
    );
  }
  const leftover = innerHeight === undefined ? 0 : innerHeight - total();
  const { start, extra } = spread(layout.justify, leftover, solved.length);
  let y = start;
  const placed = solved.map((s, i) => {
    const at = {
      ...s,
      x: offset(layout.align, inner, s.width),
      y,
      gapBefore: i ? gap + extra : null,
    };
    y += s.height + gap + extra;
    return at;
  });
  return { placed, height: innerHeight ?? total(), overflowX: false };
}

function arrangeRow(
  items: Item[],
  inner: number,
  layout: NodeLayout,
  ctx: Ctx,
): Arranged {
  const gap = ctx.spacing(layout.gap);
  const fill = (item: Item) => item.box.width === 'fill';
  const basis = (item: Item) =>
    fill(item)
      ? layout.wrap
        ? Math.min(FILL_BASIS_PX, inner)
        : 0
      : ctx.natural(item, inner);
  const lines: Item[][] = [];
  let used = 0;
  for (const item of items) {
    const width = basis(item);
    const line = lines.at(-1);
    if (!line || (layout.wrap && used + gap + width > inner + EPSILON)) {
      lines.push([item]);
      used = width;
    } else {
      line.push(item);
      used += gap + width;
    }
  }
  const placed: Placed[] = [];
  let overflowX = false;
  let y = 0;
  for (const [index, line] of lines.entries()) {
    const fixedWidth =
      sum(line.filter((item) => !fill(item)).map(basis)) +
      gap * (line.length - 1);
    if (fixedWidth > inner + EPSILON) overflowX = true;
    const fills = line.filter(fill).length;
    const share = fills ? Math.max(0, inner - fixedWidth) / fills : 0;
    const solved = line.map((item) =>
      ctx.solve(item, fill(item) ? share : basis(item)),
    );
    const height = Math.max(...solved.map((s) => s.height));
    const { start, extra } = spread(
      layout.justify,
      fills ? 0 : inner - fixedWidth,
      line.length,
    );
    let x = start;
    for (const [i, raw] of solved.entries()) {
      const s = stretch(raw, height, layout.align);
      const gapBefore = i ? gap + extra : index ? gap : null;
      placed.push({
        ...s,
        x,
        y: y + offset(layout.align, height, s.height),
        gapBefore,
      });
      x += s.width + gap + extra;
    }
    y += height + (index < lines.length - 1 ? gap : 0);
  }
  return { placed, height: y, overflowX };
}

function arrangeGrid(
  items: Item[],
  inner: number,
  layout: NodeLayout,
  ctx: Ctx,
): Arranged {
  const columns = Math.max(1, layout.columns);
  const gap = ctx.spacing(layout.gap);
  const cell = Math.max(0, (inner - gap * (columns - 1)) / columns);
  const rows: { item: Item; column: number; span: number }[][] = [];
  let column = columns;
  for (const item of items) {
    const span = Math.min(Math.max(1, item.box.span), columns);
    if (column + span > columns) {
      rows.push([]);
      column = 0;
    }
    rows.at(-1)?.push({ item, column, span });
    column += span;
  }
  const placed: Placed[] = [];
  let y = 0;
  for (const [index, row] of rows.entries()) {
    const solved = row.map(({ item, span }) => {
      const spanned = span * cell + (span - 1) * gap;
      return ctx.solve(item, widthIn(item, spanned, ctx));
    });
    const height = Math.max(...solved.map((s) => s.height));
    let right = 0;
    for (const [i, raw] of solved.entries()) {
      const s = stretch(raw, height, layout.align);
      const x = (row[i]?.column ?? 0) * (cell + gap);
      const gapBefore = i ? x - right : index ? gap : null;
      right = x + s.width;
      placed.push({
        ...s,
        x,
        y: y + offset(layout.align, height, s.height),
        gapBefore,
      });
    }
    y += height + (index < rows.length - 1 ? gap : 0);
  }
  return { placed, height: y, overflowX: false };
}

export function arrange(
  items: Item[],
  inner: number,
  layout: NodeLayout,
  ctx: Ctx,
  innerHeight?: number,
): Arranged {
  if (!items.length) return { placed: [], height: 0, overflowX: false };
  if (layout.direction === 'row') return arrangeRow(items, inner, layout, ctx);
  if (layout.direction === 'grid')
    return arrangeGrid(items, inner, layout, ctx);
  return arrangeColumn(items, inner, layout, ctx, innerHeight);
}
