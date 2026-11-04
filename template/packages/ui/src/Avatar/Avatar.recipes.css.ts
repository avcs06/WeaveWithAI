import { tokens } from '@packages/styles/tokens.css';
import { recipe } from '@vanilla-extract/recipes';

import { avatar } from './Avatar.css';

// Larger than the control scale on purpose.
export const avatarRecipe = recipe({
  base: avatar,
  variants: {
    size: {
      sm: {
        width: tokens.spacing[7],
        height: tokens.spacing[7],
        fontSize: tokens.fontSize.label,
        fontWeight: tokens.fontWeight.medium,
      },
      md: {
        width: tokens.spacing[9],
        height: tokens.spacing[9],
        fontSize: tokens.fontSize.subheading,
        fontWeight: tokens.fontWeight.medium,
      },
      lg: {
        width: tokens.spacing[14],
        height: tokens.spacing[14],
        fontSize: tokens.fontSize.heading,
        fontWeight: tokens.fontWeight.heading,
      },
    },
  },
  defaultVariants: { size: 'md' },
});
