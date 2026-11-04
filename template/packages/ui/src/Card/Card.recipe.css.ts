import { style } from '@vanilla-extract/css';

/** Columns that fill the width and drop to one on a phone. */
export const cardColumns = style({
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
});
