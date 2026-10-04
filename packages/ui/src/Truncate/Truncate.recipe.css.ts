import { style } from '@vanilla-extract/css';

/** A narrow column, like a sidebar, so the titles are cut at any viewport. */
export const narrowColumn = style({
  width: '240px',
  maxWidth: '100%',
});
