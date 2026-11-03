import { tokens } from '@packages/styles/tokens.css';
import { globalStyle, style } from '@vanilla-extract/css';

export const logo = style({
  ...tokens.logo,
  color: tokens.color.surface.logo,
});

export const link = style({});

// An icon beside the name, in the logo's color.
globalStyle(`${link} > svg`, {
  width: tokens.iconSize.subheading,
  height: tokens.iconSize.subheading,
  flexShrink: 0,
  color: tokens.color.surface.logo,
});
