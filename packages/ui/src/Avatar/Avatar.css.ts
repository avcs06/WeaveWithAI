import { tokens } from '@packages/styles/tokens.css';
import { focusRing } from '@packages/styles/utils';
import { style } from '@vanilla-extract/css';

export const avatar = style({
  overflow: 'hidden',
  borderRadius: tokens.radius.full,
  color: tokens.color.accentFg,
  background: tokens.color.accentBg,
  lineHeight: 1,
  userSelect: 'none',
  outline: 'none',
  // Alone, it takes a tab stop to show the name in its tooltip.
  selectors: { '&:focus-visible': focusRing(tokens.color.focus) },
});

export const avatarImage = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});
