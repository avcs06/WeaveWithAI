import { tokens } from '@packages/styles/tokens.css';
import { focusRing } from '@packages/styles/utils';
import { style } from '@vanilla-extract/css';

export const avatar = style({
  borderRadius: tokens.radius.full,
  color: tokens.color.primary.accentFg,
  background: tokens.color.primary.accentBg,
  lineHeight: 1,
  userSelect: 'none',
  outline: 'none',
  // Alone, it takes a tab stop to show the name in its tooltip.
  selectors: { '&:focus-visible': focusRing(tokens.color.primary.focus) },
});
