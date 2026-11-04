import { tokens } from '@packages/styles/tokens.css';
import { recipe } from '@vanilla-extract/recipes';

import {
  checkedBg,
  checkedBorder,
  checkedFg,
  checkedFocus,
  checkedHoverBg,
  dotSize,
  radioBox,
  uncheckedFocus,
} from './Radio.css';

const colors = tokens.color;
const spacing = tokens.spacing;

// The Checkbox's sizes: a box beside its label.
export const radioRecipe = recipe({
  base: radioBox,
  variants: {
    variant: {
      default: {
        vars: {
          [checkedBg]: colors.primary.accentBg,
          [checkedHoverBg]: colors.primary.accentHoverBg,
          [checkedBorder]: colors.primary.accentBorder,
          [checkedFg]: colors.primary.accentFg,
          [uncheckedFocus]: colors.primary.focus,
          [checkedFocus]: colors.primary.accentFocus,
        },
      },
      base: {
        vars: {
          [checkedBg]: colors.base.accentBg,
          [checkedHoverBg]: colors.base.accentHoverBg,
          [checkedBorder]: colors.base.accentBorder,
          [checkedFg]: colors.base.accentFg,
          [uncheckedFocus]: colors.base.focus,
          [checkedFocus]: colors.base.accentFocus,
        },
      },
    },
    size: {
      sm: {
        width: spacing[4.5],
        height: spacing[4.5],
        vars: { [dotSize]: spacing[2] },
      },
      md: {
        width: spacing[5.5],
        height: spacing[5.5],
        vars: { [dotSize]: spacing[2.5] },
      },
    },
  },
  defaultVariants: { variant: 'default', size: 'sm' },
});
