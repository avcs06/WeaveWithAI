import { tokens } from '@packages/styles/tokens.css';
import { style } from '@vanilla-extract/css';

export const title = style({
  fontFamily: tokens.fontFamily.display,
  fontSize: tokens.fontSize.title,
  fontWeight: tokens.fontWeight.title,
  lineHeight: tokens.lineHeight.title,
  color: tokens.color.surface.pageFg,
});

export const breadcrumb = style({
  fontSize: tokens.fontSize.label,
  lineHeight: tokens.lineHeight.label,
});

export const separator = style({
  width: tokens.iconSize.label,
  height: tokens.iconSize.label,
  color: tokens.color.surface.pageFgMuted,
});
