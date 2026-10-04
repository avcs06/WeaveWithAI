import { tokens } from '@packages/styles/tokens.css';
import { style } from '@vanilla-extract/css';

export const filterOperator = style({
  textAlign: 'center',
  fontWeight: tokens.fontWeight.bold,
  color: tokens.color.base.fgMuted,
});
