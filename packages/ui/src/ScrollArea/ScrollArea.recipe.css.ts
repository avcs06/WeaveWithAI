import { tokens } from '@packages/styles/tokens.css';
import { style } from '@vanilla-extract/css';

const spacing = tokens.spacing;

/** A list's own height: about six rows. */
export const listHeight = style({
  height: `calc(3 * ${spacing[16]})`,
});

/** A side panel's height, which its header, list and footer share. */
export const panelHeight = style({
  height: `calc(5 * ${spacing[16]})`,
});

/** A box of legal text that shows a few paragraphs at a time. */
export const textHeight = style({
  maxHeight: `calc(2 * ${spacing[16]})`,
});
