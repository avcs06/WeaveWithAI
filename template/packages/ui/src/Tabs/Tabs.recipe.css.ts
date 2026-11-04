import { tokens } from '@packages/styles/tokens.css';
import { style } from '@vanilla-extract/css';

/** A side panel's height, which the tab list and the active panel share. */
export const panelHeight = style({
  height: `calc(4 * ${tokens.spacing[16]})`,
});
