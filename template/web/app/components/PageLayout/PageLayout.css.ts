import { tokens } from '@packages/styles/tokens.css';
import { createVar, style } from '@vanilla-extract/css';

const surface = tokens.color.surface;
const divider = `1px solid ${surface.divider}`;

export const areas = createVar();
export const columns = createVar();
export const rows = createVar();
/** The header's rendered height: an overlay header's page pads by it. */
export const headerHeight = createVar();
export const padding = createVar();
export const gap = createVar();
export const maxWidth = createVar();

export const root = style({
  display: 'grid',
  gridTemplateAreas: areas,
  gridTemplateColumns: columns,
  gridTemplateRows: rows,
  minHeight: '100dvh',
  selectors: {
    // The frame fills the screen and only the main region scrolls.
    '&[data-scroll-main]': { height: '100dvh' },
  },
});

const separations = (side: 'Top' | 'Bottom' | 'Left' | 'Right', on = '&') => ({
  [`${on}[data-separation="background"]`]: { background: surface.frameBg },
  [`${on}[data-separation="divider"]`]: { [`border${side}`]: divider },
  [`${on}[data-separation="shadow"]`]: { boxShadow: tokens.boxShadow.card },
});

// A bar's height is its items and its padding.
const bar = {
  display: 'flex',
  alignItems: 'center',
  minWidth: 0,
  padding,
  gap,
} as const;

// Three slots: the left and right at the bar's ends, the center in its middle whatever the sides hold.
export const header = style({
  ...bar,
  // Fixed above and below, so every theme's header is the same height. Its sides are
  // the sidebar rows' margin and padding, so the header's items start where theirs do.
  padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
  gap: tokens.spacing[4],
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
  gridArea: 'header',
  // Solid, so content never shows through a sticky header.
  background: surface.pageBg,
  selectors: {
    ...separations('Bottom'),
    '&[data-sticky]': { position: 'sticky', top: 0, zIndex: 1 },
    // Over the main region it shares a row with, which comes later and would paint over it.
    '&[data-overlay]': {
      background: 'transparent',
      alignSelf: 'start',
      position: 'relative',
      zIndex: 1,
    },
  },
});

const headerSlot = {
  display: 'flex',
  alignItems: 'center',
  minWidth: 0,
  gap: tokens.spacing[4],
} as const;

export const headerLeft = style({ ...headerSlot, justifySelf: 'start' });
export const headerCenter = style({ ...headerSlot, justifySelf: 'center' });
export const headerRight = style({ ...headerSlot, justifySelf: 'end' });

export const footer = style({
  ...bar,
  gridArea: 'footer',
  selectors: {
    ...separations('Top'),
    '&[data-lines]': { flexDirection: 'column', alignItems: 'stretch' },
  },
});

// The SidebarMenu keeps the menu's spacing and scrolls its own rows; the frame gives it a column and a separation.
export const sidebar = style({
  minHeight: 0,
  selectors: {
    ...separations('Right', '&[data-side="left"]'),
    ...separations('Left', '&[data-side="right"]'),
  },
});

export const main = style({
  gridArea: 'main',
  minWidth: 0,
  // A Hero measures the region's width to span it.
  containerType: 'inline-size',
  selectors: {
    // An overlay header lies over the main region's top.
    [`${root}[data-overlay] > &`]: { gridRow: 'header-start / main-end' },
    // Its scroll area takes the row's height and no more.
    [`${root}[data-scroll-main] > &`]: { minHeight: 0 },
    '&[data-panel]': { padding },
  },
});

export const container = style({
  width: '100%',
  minWidth: 0,
  padding,
  selectors: {
    // The box spans the main region, so its background does too; the padding keeps the content at maxWidth.
    '&[data-container="fixed"]': {
      paddingInline: `max(${padding}, calc((100% - ${maxWidth}) / 2))`,
    },
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
