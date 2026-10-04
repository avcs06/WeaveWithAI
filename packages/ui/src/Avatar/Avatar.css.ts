import { tokens } from '@packages/styles/tokens.css';
import { style } from '@vanilla-extract/css';

export const avatar = style({
  overflow: 'hidden',
  borderRadius: tokens.radius.full,
  color: tokens.color.accentFg,
  background: tokens.color.accentBg,
  lineHeight: 1,
  userSelect: 'none',
});

export const avatarImage = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});
