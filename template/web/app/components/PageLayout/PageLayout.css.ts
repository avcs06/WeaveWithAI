import { tokens } from '@packages/styles/tokens.css';
import { createVar, globalStyle, style } from '@vanilla-extract/css';

const surface = tokens.color.surface;
const divider = `1px solid ${surface.divider}`;

export const areas = createVar();
export const columns = createVar();
export const rows = createVar();
/** The header's rendered height: sticky sidebars start under it, an overlay header's page pads by it. */
export const headerHeight = createVar();
export const barHeight = createVar();
/** A bar with a set height centers its row in it; one sized by its content pads above and below too. */
export const barPadding = createVar();
export const padding = createVar();
export const gap = createVar();
export const width = createVar();
export const maxWidth = createVar();
export const sectionGap = createVar();

export const root = style({
  display: 'grid',
  gridTemplateAreas: areas,
  gridTemplateColumns: columns,
  gridTemplateRows: rows,
  minHeight: '100dvh',
});

const separations = (
  side: 'Top' | 'Bottom' | 'Left' | 'Right',
  on = '&',
) => ({
  [`${on}[data-separation="background"]`]: { background: surface.frameBg },
  [`${on}[data-separation="divider"]`]: { [`border${side}`]: divider },
  [`${on}[data-separation="shadow"]`]: { boxShadow: tokens.boxShadow.card },
});

const bar = {
  display: 'flex',
  alignItems: 'center',
  minWidth: 0,
  minHeight: barHeight,
  paddingInline: padding,
  paddingBlock: barPadding,
  gap,
} as const;

export const header = style({
  ...bar,
  gridArea: 'header',
  // Solid, so content never shows through a sticky header.
  background: surface.pageBg,
  selectors: {
    ...separations('Bottom'),
    '&[data-sticky]': { position: 'sticky', top: 0, zIndex: 1 },
    '&[data-overlay]': { background: 'transparent', alignSelf: 'start' },
  },
});

export const footer = style({
  ...bar,
  gridArea: 'footer',
  selectors: separations('Top'),
});

export const sidebar = style({
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  width,
  padding,
  gap,
  selectors: {
    ...separations('Right', '&[data-side="left"]'),
    ...separations('Left', '&[data-side="right"]'),
    '&[data-sticky]': {
      position: 'sticky',
      alignSelf: 'start',
      overflowY: 'auto',
    },
    // Under a sticky header that spans it, a sticky sidebar starts below the header.
    '&[data-sticky][data-under-header]': {
      top: headerHeight,
      height: `calc(100dvh - ${headerHeight})`,
    },
    '&[data-sticky]:not([data-under-header])': { top: 0, height: '100dvh' },
  },
});

export const main = style({
  gridArea: 'main',
  minWidth: 0,
  // Bleed reaches the main region's edges by its width.
  containerType: 'inline-size',
  selectors: {
    // An overlay header lies over the main region's top.
    [`${root}[data-overlay] > &`]: { gridRow: 'header-start / main-end' },
    '&[data-panel]': { padding },
  },
});

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  gap: sectionGap,
  width: '100%',
  minWidth: 0,
  padding,
  selectors: {
    '&[data-container="fixed"]': { maxWidth, marginInline: 'auto' },
    [`${root}[data-overlay] &`]: {
      paddingTop: `calc(${headerHeight} + ${padding})`,
    },
    '&[data-separation="background"]': {
      background: surface.pageBg,
      borderRadius: tokens.radius.surface,
    },
    '&[data-separation="divider"]': {
      border: divider,
      borderRadius: tokens.radius.surface,
    },
    '&[data-separation="shadow"]': {
      background: surface.pageBg,
      borderRadius: tokens.radius.surface,
      boxShadow: tokens.boxShadow.card,
    },
  },
});

// Runs to the main region's edges; its content stays in the container's width.
export const bleed = style({
  // Half the space between the container and the main region (100cqw) on each side: no token measures the frame.
  marginInline: 'calc((100% - 100cqw) / 2)',
  // The same half back inside, so the content lines up with the container.
  paddingInline: 'calc((100cqw - 100%) / 2)',
});

// The first band under an overlay header starts under the header, so its background shows behind it.
globalStyle(`${root}[data-overlay] ${container} > ${bleed}:first-child`, {
  marginTop: `calc(-1 * (${headerHeight} + ${padding}))`,
  paddingTop: `calc(${headerHeight} + ${padding})`,
});
