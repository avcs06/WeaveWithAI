import { tokens } from '@packages/styles/tokens.css';
import { globalStyle, style } from '@vanilla-extract/css';

const colors = tokens.color.surface;

/** Marks an element whose gap spaces the sections right inside it, like a SectionGroup or the page's container. */
export const sectionGroup = style({});

// A section with no group around it pads itself above and below.
export const section = style({
  selectors: {
    [`:not(${sectionGroup}) > &`]: { paddingBlock: tokens.spacing[5] },
  },
});

// One size at every heading level: the level is for the outline only.
export const sectionTitle = style({
  fontFamily: tokens.fontFamily.display,
  fontSize: tokens.fontSize.heading,
  fontWeight: tokens.fontWeight.heading,
  lineHeight: tokens.lineHeight.heading,
  color: colors.pageFg,
});

globalStyle(`${sectionTitle} > [data-slot='icon']`, {
  width: tokens.iconSize.heading,
  height: tokens.iconSize.heading,
});

export const sectionDescription = style({
  fontSize: tokens.fontSize.body,
  lineHeight: tokens.lineHeight.body,
  color: colors.pageFgMuted,
});
