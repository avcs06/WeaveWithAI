import { tokens } from '@packages/styles/tokens.css';
import { globalStyle, style } from '@vanilla-extract/css';

const colors = tokens.color.base;

// One size at every heading level: the level is for the outline only.
export const sectionTitle = style({
  fontSize: tokens.fontSize.heading,
  fontWeight: tokens.fontWeight.heading,
  lineHeight: tokens.lineHeight.heading,
  color: colors.fg,
});

globalStyle(`${sectionTitle} > [data-slot='icon']`, {
  width: tokens.iconSize.heading,
  height: tokens.iconSize.heading,
});

export const sectionDescription = style({
  fontSize: tokens.fontSize.body,
  lineHeight: tokens.lineHeight.body,
  color: colors.fgMuted,
});
