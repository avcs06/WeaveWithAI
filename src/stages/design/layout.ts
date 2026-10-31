import {
  CONTENT_WIDTH_PX,
  DIALOG_SIZE,
  VIEWPORT,
} from '../../config/design';
import type { Inventory } from '../../ds/inventory';
import { type Item, type RectKind, round, type Solved } from './layout-arrange';
import { NO_PADDING, type Sizes, sizes } from './layout-boxes';
import { context, emit, type Rect } from './layout-solve';
import type {
  DesignNode,
  DesignScreen,
  NodeBox,
  Region,
  Screens,
} from './schema';

// The layout skeleton (DS6b): a rectangle for every shell region, section and
// node of every screen at desktop width, from the nodes' boxes and
// layouts, the inventory's measured boxes and the type scale. Pure and
// deterministic. Nothing is fixed silently: a row that does not fit is
// marked overflowX, and the rules decide.

export type { Rect, RectKind };

export type ScreenLayout = { width: number; height: number; rects: Rect[] };
export type ScreenSkeleton = ScreenLayout & {
  id: string;
  name: string;
  type: DesignScreen['type'];
  route: string;
  kind: DesignScreen['kind'];
  /** Nodes and sections the default state does not show, with the states that do. */
  hidden: { id: string; states: string[] }[];
};
export type Skeleton = {
  viewport: typeof VIEWPORT;
  screens: ScreenSkeleton[];
};

const FILL: NodeBox = {
  width: 'fill',
  widthPx: 0,
  height: 'content',
  heightPx: 0,
  minHeightPx: 0,
  span: 1,
};
const shown = (node: DesignNode) =>
  node.states.length === 0 || node.states.includes('default');

function kindOf(node: DesignNode, hasChildren: boolean): RectKind {
  if (node.newComponent) return 'newComponent';
  if (hasChildren) return 'container';
  if (node.component !== 'none') return 'component';
  const text = node.role === 'heading' || node.role === 'text';
  return text || node.typeScale !== 'none' ? 'text' : 'component';
}

/** Sections by order, nodes under their section or shell region by parent and order; what the default state hides is listed. */
function tree(screens: Screens, screen: DesignScreen) {
  const hidden: ScreenSkeleton['hidden'] = [];
  const byOrder = <T extends { order: number; id: string }>(a: T, b: T) =>
    a.order - b.order || a.id.localeCompare(b.id);
  const children = new Map<string, DesignNode[]>();
  for (const node of screens.nodes) {
    const key = `${node.section}|${node.parent}`;
    children.set(key, [...(children.get(key) ?? []), node]);
  }
  const build = (node: DesignNode): Item | undefined => {
    if (!shown(node)) {
      hidden.push({ id: node.id, states: node.states });
      return undefined;
    }
    const kids = (children.get(`${node.section}|${node.id}`) ?? [])
      .sort(byOrder)
      .flatMap((child) => build(child) ?? []);
    const { id, what, box, layout } = node;
    return {
      id,
      kind: kindOf(node, kids.length > 0),
      what,
      box,
      layout,
      node,
      children: kids,
    };
  };
  const top = (container: string) =>
    (children.get(`${container}|`) ?? []).sort(byOrder);
  const sections = screens.sections
    .filter((section) => section.screen === screen.id)
    .sort(byOrder)
    .flatMap((section): Item[] => {
      const kids = top(section.id).flatMap((node) => build(node) ?? []);
      if (top(section.id).length && !kids.length) {
        const states = [
          ...new Set(top(section.id).flatMap((node) => node.states)),
        ];
        hidden.push({ id: section.id, states });
        return [];
      }
      const { id, title, box, layout } = section;
      return [
        { id, kind: 'section', what: title, box, layout, children: kids },
      ];
    });
  const shell = screens.shells.find((s) => s.id === screen.shell);
  const regions = (shell?.regions ?? []).map((region) => ({
    region,
    what: `${shell?.name} shell, ${region.place}`,
    kids: top(region.id).flatMap((node) => build(node) ?? []),
  }));
  return { sections, regions, hidden };
}
type Docked = ReturnType<typeof tree>['regions'][number];
const frameRect = (
  id: string,
  parent: string,
  depth: number,
  what: string,
  x: number,
  y: number,
  width: number,
  height: number,
  padding = NO_PADDING,
): Rect => ({
  id,
  kind: 'frame',
  parent,
  depth,
  x: round(x),
  y: round(y),
  width: round(width),
  height: round(height),
  heightFrom: 'frame',
  estimated: false,
  gapBefore: null,
  padding,
  overflowX: false,
  what,
  lines: 0,
});

const SIDES = new Set<Region['place']>(['left', 'right']);

/** One screen: the page and its shell regions or the dialog surface, then its sections and nodes. */
function layoutScreen(
  screen: DesignScreen,
  { sections, regions }: Pick<ReturnType<typeof tree>, 'sections' | 'regions'>,
  container: Screens['containers']['app'],
  s: Sizes,
): ScreenLayout {
  const ctx = context(s);
  const { width: vw, height: vh } = VIEWPORT;
  const pad = ctx.spacing(screen.layout.padding);
  const root: Item = {
    id: `${screen.id}.content`,
    kind: 'frame',
    what: 'content',
    box: FILL,
    layout: { ...screen.layout, padding: '0' },
    children: sections,
  };
  const rects: Rect[] = [];
  if (screen.type === 'page') {
    // Regions dock in order, each on the space the ones before it left; an
    // overlay region takes no space. Side regions run the page's full height,
    // which is known only once the content is solved, so they are solved last.
    const item = ({ region, what, kids }: Docked, box: NodeBox): Item => ({
      id: region.id,
      kind: 'frame',
      what,
      box,
      layout: region.layout,
      children: kids,
    });
    const band = (docked: Docked, width: number) => {
      const { box } = docked.region;
      const solved = ctx.solve(item(docked, { ...box, span: 1 }), width);
      return {
        ...solved,
        height: box.height === 'fixed' ? box.heightPx : solved.height,
      };
    };
    let free = vw;
    let taken = 0;
    for (const docked of regions) {
      if (docked.region.overlay) continue;
      if (SIDES.has(docked.region.place)) free -= docked.region.box.widthPx;
      else taken += band(docked, free).height;
    }
    // The layout's container holds the page's column, which can only narrow it.
    const box =
      container.container === 'fixed'
        ? Math.min(container.maxWidthPx, free)
        : free;
    const target =
      screen.contentWidth === 'full'
        ? box
        : Math.min(CONTENT_WIDTH_PX[screen.contentWidth], box);
    const column = Math.max(0, Math.min(target, box - 2 * pad));
    const solved = ctx.solve(root, column);
    const height = Math.max(vh, taken + pad + solved.height + pad);
    rects.push(
      frameRect(screen.id, '', 0, screen.name, 0, 0, vw, height, [
        pad,
        pad,
        pad,
        pad,
      ]),
    );
    const area = { x: 0, y: 0, width: vw, height };
    const placed: { solved: Solved; x: number; y: number }[] = [];
    for (const docked of regions) {
      const { place, overlay, box } = docked.region;
      const side = SIDES.has(place);
      const part = side
        ? {
            ...ctx.solve(
              item(docked, {
                ...box,
                height: 'fixed',
                heightPx: area.height,
                span: 1,
              }),
              box.widthPx,
            ),
            height: area.height,
          }
        : band(docked, area.width);
      const x = place === 'right' ? area.x + area.width - part.width : area.x;
      const y =
        place === 'bottom' ? area.y + area.height - part.height : area.y;
      placed.push({ solved: part, x, y });
      if (overlay) continue;
      if (side) {
        area.width -= part.width;
        if (place === 'left') area.x += part.width;
      } else {
        area.height -= part.height;
        if (place === 'top') area.y += part.height;
      }
    }
    const x =
      container.align === 'center'
        ? area.x + (area.width - column) / 2
        : area.x + pad;
    emit(solved, { x, y: area.y + pad, gapBefore: null }, screen.id, 1, rects);
    // After the content, so an overlay region draws over it.
    for (const part of placed)
      emit(
        part.solved,
        { x: part.x, y: part.y, gapBefore: null },
        screen.id,
        1,
        rects,
      );
    return { width: vw, height, rects };
  }
  const size = DIALOG_SIZE[screen.contentWidth];
  const dialog = ctx.byName.get('Dialog')?.box ?? {};
  const header = dialog[`${size}/header`]?.height ?? 0;
  const [bt, br, bb, bl] = dialog[`${size}/body`]?.padding ?? NO_PADDING;
  const width = dialog[size]?.width ?? 0;
  const solved = ctx.solve(root, Math.max(0, width - bl - br - 2 * pad));
  const inner = header + bt + pad + solved.height + pad + bb;
  const drawer = screen.type === 'drawer';
  const height = drawer ? Math.max(vh, inner) : inner;
  const x = drawer ? vw - width : (vw - width) / 2;
  const y = drawer ? 0 : Math.max(16, (vh - height) / 2);
  rects.push(
    frameRect(screen.id, '', 0, screen.name, x, y, width, height, [
      bt + pad,
      br + pad,
      bb + pad,
      bl + pad,
    ]),
  );
  rects.push(
    frameRect(
      `${screen.id}.header`,
      screen.id,
      1,
      `${screen.name}, the dialog header`,
      x,
      y,
      width,
      header,
    ),
  );
  emit(
    solved,
    { x: x + bl + pad, y: y + header + bt + pad, gapBefore: null },
    screen.id,
    1,
    rects,
  );
  return { width: vw, height: Math.max(vh, y + height + 16), rects };
}

/** Every screen at desktop width. */
export function skeleton(screens: Screens, inv: Inventory): Skeleton {
  const s = sizes(inv, screens.newComponents);
  return {
    viewport: VIEWPORT,
    screens: screens.screens.map((screen) => {
      const { hidden, ...parts } = tree(screens, screen);
      return {
        id: screen.id,
        name: screen.name,
        type: screen.type,
        route: screen.route,
        kind: screen.kind,
        hidden,
        ...layoutScreen(screen, parts, screens.containers[screen.kind], s),
      };
    }),
  };
}
