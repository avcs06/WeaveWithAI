import { style } from '@vanilla-extract/css';

export const truncate = style({
  minWidth: 0,
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  // Sideways only: clipping both ways would also cut descenders (g, y) when
  // the line height is tight or zero. `clip`, unlike `hidden`, doesn't turn
  // the other axis into a scroll container.
  overflowX: 'clip',
  overflowY: 'visible',
});
