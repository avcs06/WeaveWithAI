import { style } from '@vanilla-extract/css';

export const loadingIcon = style({
  '@media': {
    // A still spinner reads as stuck, so it only slows down.
    '(prefers-reduced-motion: reduce)': {
      selectors: {
        '&.animate-spin': { animationDuration: '3s' },
      },
    },
  },
});
