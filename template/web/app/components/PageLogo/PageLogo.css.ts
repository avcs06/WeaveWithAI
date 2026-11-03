import { tokens } from '@packages/styles/tokens.css';
import { style } from '@vanilla-extract/css';

export const logo = style({
  ...tokens.logo,
  color: tokens.color.surface.logo,
});
