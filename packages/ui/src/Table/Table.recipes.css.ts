import { recipe } from '@vanilla-extract/recipes';

export const alignRecipe = recipe({
  variants: {
    align: {
      left: { textAlign: 'left' },
      center: { textAlign: 'center' },
      right: { textAlign: 'right' },
    },
  },
  defaultVariants: { align: 'left' },
});
