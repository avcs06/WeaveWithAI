import { tokens } from '@packages/styles/tokens.css';
import { style } from '@vanilla-extract/css';

const colors = tokens.color;

export const header = style({
  height: '60px',
  background: colors.base.bg,
  borderBottom: `1px solid ${colors.base.divider}`,
});
