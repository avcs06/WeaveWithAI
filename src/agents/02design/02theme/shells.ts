import type { Region, Shell } from '../schema-boxes';
import type { Layouts, PageLayout } from './schema';

// The theme's layouts as shells, the shapes the solver, the shell rules and the
// frame calls read (DS4a): each layout's needed parts become regions, docked in
// the layout's order.

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
function justify(
  first: string,
  middle: string,
  last: string,
): Part['layout']['justify'] {
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
export function layoutShell(
  id: string,
  name: string,
  layout: PageLayout,
): Shell {
  const { header, footer, docksFirst } = layout;
  const bars = [
    ...(header.needed ? [bar(header, 'top')] : []),
    ...(footer.needed ? [bar(footer, 'bottom')] : []),
  ];
  const sides = [layout.sidebar, layout.extraSidebar]
    .filter((part) => part.needed)
    .map(sidebar);
  const parts =
    docksFirst === 'header' ? [...bars, ...sides] : [...sides, ...bars];
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
