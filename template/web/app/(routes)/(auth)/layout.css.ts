import { style } from '@vanilla-extract/css';

// The width of a form's field, so the button's end lines up with the field's.
export const column = style({
  width: 'min(100%, 320px)',
  marginInline: 'auto',
});
