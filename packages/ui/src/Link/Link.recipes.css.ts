import { tokens } from '@packages/styles/tokens.css';
import { recipe } from '@vanilla-extract/recipes';

import { link, linkBorder, linkFg, linkFocusColor } from './Link.css';

const colors = tokens.color;

export const linkRecipe = recipe({
  base: link,
  variants: {
    variant: {
      default: {
        vars: {
          [linkFg]: colors.fg,
          [linkBorder]: colors.border,
          [linkFocusColor]: colors.focus,
        },
      },
      base: {
        vars: {
          [linkFg]: colors.base.fg,
          [linkBorder]: colors.base.border,
          [linkFocusColor]: colors.base.focus,
        },
      },
    },
    plain: {
      true: {
        backgroundImage: 'none',
        selectors: { '&[data-disabled]': { backgroundImage: 'none' } },
      },
      false: {},
    },
  },
  defaultVariants: { variant: 'default', plain: false },
});
