import { tokens } from '@packages/styles/tokens.css';
import { globalStyle, style } from '@vanilla-extract/css';

export const logo = style({
  ...tokens.logo,
  color: tokens.color.surface.logo,
});

export const link = style({});

// An icon beside the name, in the logo's color.
globalStyle(`${link} > svg`, {
  // Halfway between the name's font size and its line height, whatever size the bar gives the logo.
  width: 'calc((1em + 1lh) / 2)',
  height: 'calc((1em + 1lh) / 2)',
  flexShrink: 0,
  color: tokens.color.surface.logo,
});
