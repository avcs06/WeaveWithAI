import { tokens } from '@packages/styles/tokens.css';
import { recipe } from '@vanilla-extract/recipes';

export const accordionRecipe = recipe({
  variants: {
    // `bordered`: a frame around the sections. `open`: dividers only.
    border: {
      open: {},
      bordered: {
        border: `1px solid ${tokens.color.base.border}`,
        borderRadius: tokens.radius.surface,
      },
    },
  },
  defaultVariants: { border: 'bordered' },
});
