import { tokens } from '@packages/styles/tokens.css';
import { style } from '@vanilla-extract/css';

/** Wide enough for an address on two lines. */
export const venueCard = style({
  width: `calc(5 * ${tokens.spacing[16]})`,
});
