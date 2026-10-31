import type { DesignNode, Ia, Region, Screens, Shell } from './schema';
import type { Layouts, PageLayout } from './schema-theme';
import type { Theme } from './theme';

// The theme's layouts and defaults in the shapes the solver, the shell rules
// and the nodes calls read (DS4a): each layout becomes a shell, a framed page
// takes its kind's shell, a page's padding and section gap come from its
// layout, and a node's empty size or look takes the component's default.

/** The shell each kind's layout becomes. */
export const SHELL_IDS = { app: 'SH1', marketing: 'SH2' } as const;

type Part = Omit<Region, 'id'>;

/** What a region holds, by slot, for the nodes call: "start: the wordmark; end: Sign in". */
function holds(slots: [string, string][]): string {
  return slots
    .filter(([, what]) => what)
    .map(([where, what]) => `${where}: ${what}`)
    .join('; ');
}

/** The children's place along a bar or a sidebar, from the slots that hold something. */
function justify(first: string, middle: string, last: string): Part['layout']['justify'] {
  if (first && !middle && !last) return 'start';
  if (!first && middle && !last) return 'center';
  if (!first && !middle && last) return 'end';
  return 'between';
}

function bar(
  part: PageLayout['header'] | PageLayout['footer'],
  place: 'top' | 'bottom',
): Part {
  return {
    place,
    overlay: 'overlay' in part && part.overlay,
    box: {
      width: 'fill',
      widthPx: 0,
      height: part.heightPx ? 'fixed' : 'content',
      heightPx: part.heightPx,
      minHeightPx: 0,
    },
    layout: {
      direction: 'row',
      gap: part.gap,
      padding: part.padding,
      columns: 0,
      align: 'center',
      justify: justify(part.start, part.center, part.end),
      wrap: false,
    },
    holds: holds([
      ['start', part.start],
      ['center', part.center],
      ['end', part.end],
    ]),
  };
}

function sidebar(part: PageLayout['sidebar']): Part {
  return {
    place: part.side,
    overlay: false,
    box: {
      width: 'fixed',
      widthPx: part.widthPx,
      height: 'fill',
      heightPx: 0,
      minHeightPx: 0,
    },
    layout: {
      direction: 'column',
      gap: part.gap,
      padding: part.padding,
      columns: 0,
      align: 'stretch',
      justify: justify(part.top, '', part.bottom),
      wrap: false,
    },
    holds: holds([
      ['top', part.top],
      ['bottom', part.bottom],
    ]),
  };
}

/** One layout as a shell: its needed parts as regions, in the order they dock. */
export function layoutShell(id: string, name: string, layout: PageLayout): Shell {
  const { header, footer, docksFirst } = layout;
  const bars = [
    ...(header.needed ? [bar(header, 'top')] : []),
    ...(footer.needed ? [bar(footer, 'bottom')] : []),
  ];
  const sides = [layout.sidebar, layout.extraSidebar]
    .filter((part) => part.needed)
    .map(sidebar);
  const parts = docksFirst === 'header' ? [...bars, ...sides] : [...sides, ...bars];
  return {
    id,
    name,
    purpose: `The frame of every framed ${name} page, from the theme's ${name} layout.`,
    regions: parts.map((part, i) => ({ id: `${id}.r${i + 1}`, ...part })),
  };
}

/** The shells of the layouts that have a frame. */
export function layoutShells(layouts: Layouts): Shell[] {
  return (['app', 'marketing'] as const)
    .map((kind) => layoutShell(SHELL_IDS[kind], kind, layouts[kind]))
    .filter((shell) => shell.regions.length);
}

/**
 * Nodes with an empty size or look set to the theme's default. `base` stays as
 * written: it asks for the design system's plain look over the theme's, which
 * the coding stage must still see.
 */
export function withDefaults(nodes: DesignNode[], theme: Theme): DesignNode[] {
  return nodes.map((node) => {
    const preset = theme.defaults[node.component] ?? {};
    const size = (node.size || (preset.size ?? '')) as DesignNode['size'];
    return { ...node, size, look: node.look || (preset.look ?? '') };
  });
}

/** The IA and every call's nodes as `02-screens.json`, with the theme's layouts and defaults applied. */
export function resolveScreens(
  ia: Ia,
  nodes: DesignNode[],
  theme: Theme,
): Screens {
  const shells = layoutShells(theme.layouts);
  const framed = new Set(shells.map((shell) => shell.id));
  const screens = ia.screens.map((screen) => {
    const { main } = theme.layouts[screen.kind];
    const page = screen.type === 'page';
    const shell = SHELL_IDS[screen.kind];
    return {
      ...screen,
      shell: page && screen.framed && framed.has(shell) ? shell : '',
      layout: {
        ...screen.layout,
        // DESIGN-023 asks a dialog or drawer for its own gap and padding.
        gap: page ? main.sectionGap : screen.layout.gap || '0',
        padding: page ? main.padding : screen.layout.padding || '0',
      },
    };
  });
  const container = ({ main }: PageLayout) => ({
    container: main.container,
    maxWidthPx: main.maxWidthPx,
    align: main.align,
  });
  return {
    ...ia,
    screens,
    containers: {
      app: container(theme.layouts.app),
      marketing: container(theme.layouts.marketing),
    },
    shells,
    nodes: withDefaults(nodes, theme),
  };
}
