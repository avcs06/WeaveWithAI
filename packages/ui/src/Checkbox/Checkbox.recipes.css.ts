import { tokens } from '@packages/styles/tokens.css';
import { recipe } from '@vanilla-extract/recipes';

import {
  checkboxBox,
  checkedBg,
  checkedBorder,
  checkedFg,
  checkedFocus,
  checkedHoverBg,
  iconSize,
  uncheckedFocus,
} from './Checkbox.css';

const colors = tokens.color;
const spacing = tokens.spacing;

// Smaller than the control scale on purpose: a box beside its label.
export const checkboxRecipe = recipe({
  base: checkboxBox,
  variants: {
    variant: {
      default: {
        vars: {
          [checkedBg]: colors.accentBg,
          [checkedHoverBg]: colors.accentHoverBg,
          [checkedBorder]: colors.accentBorder,
          [checkedFg]: colors.accentFg,
          [uncheckedFocus]: colors.focus,
          [checkedFocus]: colors.accentFocus,
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
        vars: { [iconSize]: spacing[3.5] },
      },
      md: {
        width: spacing[5.5],
        height: spacing[5.5],
        vars: { [iconSize]: spacing[4] },
      },
    },
  },
  defaultVariants: { variant: 'default', size: 'sm' },
});
