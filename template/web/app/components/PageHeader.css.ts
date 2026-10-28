import { tokens } from '@packages/styles/tokens.css';
import { style } from '@vanilla-extract/css';

const colors = tokens.color;

export const header = style({
  background: colors.surface.frameBg,
  borderBottom: `1px solid ${colors.surface.divider}`,
});
