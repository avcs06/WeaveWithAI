import { tokens } from '@packages/styles/tokens.css';
import { style } from '@vanilla-extract/css';

export const fallback = style({
  color: tokens.color.base.fgMuted,
  outline: 'none',
});

export const fallbackIcon = style({
  color: tokens.color.error.fgMuted,
});
