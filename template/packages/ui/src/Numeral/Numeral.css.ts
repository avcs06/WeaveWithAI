import { tokens } from '@packages/styles/tokens.css';
import { style } from '@vanilla-extract/css';

// Mono digits all have one width, so figures line up in a column and a count
// that changes doesn't move what sits beside it.
export const numeral = style({
  fontFamily: tokens.fontFamily.mono,
});
