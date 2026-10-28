import { tokens } from '@packages/styles/tokens.css';
import { style } from '@vanilla-extract/css';

export const pagination = style({
  color: tokens.color.base.fgMuted,
});

export const count = style({
  color: tokens.color.base.fg,
  fontWeight: tokens.fontWeight.semibold,
});

// Fits "100 / page" with the chevron.
export const pageSizeSelect = style({
  width: `calc(${tokens.spacing[16]} + ${tokens.spacing[14]})`,
});
