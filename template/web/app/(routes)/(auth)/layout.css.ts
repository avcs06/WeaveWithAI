import { tokens } from '@packages/styles/tokens.css';
import { style } from '@vanilla-extract/css';

// A form's field width plus the box's padding, so the button's end lines up with the field's.
export const box = style({
  width: `min(100%, calc(320px + 2 * ${tokens.spacing[6]}))`,
  marginInline: 'auto',
  padding: tokens.spacing[6],
  border: `1px solid ${tokens.color.surface.divider}`,
  borderRadius: tokens.radius.surface,
  background: tokens.color.surface.pageBg,
});
