import { tokens } from '@packages/styles/tokens.css';
import { style } from '@vanilla-extract/css';

// Set like the rows it stands in for, and muted.
export const searchMessage = style({
  fontSize: tokens.fontSize.label,
  lineHeight: tokens.lineHeight[3.5],
  color: tokens.color.base.fgMuted,
});
