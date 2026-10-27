import { tokens } from '@packages/styles/tokens.css';
import { style } from '@vanilla-extract/css';

import { cell } from '../Table.css';

// Pulled out into the cell's inline padding.
export const cellControl = style({
  marginInline: `calc(${tokens.spacing[1.5]} * -1)`,
});

// Scoped to the cell, so it outranks the button's own styles. A touch on the
// handle drags the row instead of scrolling the page.
export const dragHandle = style({
  touchAction: 'none',
  selectors: {
    [`${cell} &`]: { cursor: 'grab' },
    [`${cell} &[data-disabled="true"]`]: { cursor: 'not-allowed' },
    // No hover or press feedback: the handle is grabbed, not clicked. The
    // keyboard focus ring shares Button's :active rule, so it stays.
    [`${cell} &:hover:not(:focus-visible), ${cell} &:active:not(:focus-visible)`]:
      {
        background: 'transparent',
        boxShadow: 'none',
      },
  },
});
