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
          [linkFg]: colors.primary.fg,
          [linkBorder]: colors.primary.border,
          [linkFocusColor]: colors.primary.focus,
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
