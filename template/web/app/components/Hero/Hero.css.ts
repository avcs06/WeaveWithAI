import { tokens } from '@packages/styles/tokens.css';
import { style } from '@vanilla-extract/css';

// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- the container's padding and the header's height, which the band reaches over.
import { headerHeight, padding, root } from '../PageLayout/PageLayout.css';

// The page container's inline padding: the main region's width (its query
// container) less the container's content width (the band's 100%), halved.
const bleed = 'calc((100cqw - 100%) / 2)';
const space = tokens.spacing[16];

// Out to the main region's edges, its content back on the page's edge.
export const hero = style({
  marginInline: `calc(-1 * ${bleed})`,
  paddingInline: bleed,
  paddingBlock: space,
  background: `linear-gradient(180deg, ${tokens.color.primary.bg}, ${tokens.color.surface.pageBg})`,
  selectors: {
    // First on the page, it meets the frame's header: over the container's
    // top padding, and under a header that overlays the page.
    '&:first-child': { marginTop: `calc(-1 * ${padding})` },
    [`${root}[data-overlay] &:first-child`]: {
      marginTop: `calc(-1 * (${headerHeight} + ${padding}))`,
      paddingTop: `calc(${headerHeight} + ${space})`,
    },
  },
});

export const split = style({
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
});

export const title = style({
  fontFamily: tokens.fontFamily.display,
  fontSize: tokens.fontSize.display,
  fontWeight: tokens.fontWeight.display,
  lineHeight: tokens.lineHeight.display,
  color: tokens.color.surface.pageFg,
});

export const description = style({
  // A line of about sixty characters reads in one sweep; wider, the eye loses the next line.
  maxWidth: '60ch',
  fontSize: tokens.fontSize.subheading,
  lineHeight: tokens.lineHeight.subheading,
  color: tokens.color.surface.pageFgMuted,
});
