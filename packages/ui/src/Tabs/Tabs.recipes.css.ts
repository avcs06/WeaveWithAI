import { tokens } from '@packages/styles/tokens.css';
import { recipe } from '@vanilla-extract/recipes';

import { focus, underline } from './Tabs.css';

const colors = tokens.color;

// Neutral text: only the active underline and the focus ring show the
// variant.
export const tabsRecipe = recipe({
  variants: {
    variant: {
      default: {
        vars: {
          [underline]: colors.accentBg,
          [focus]: colors.accentFocus,
        },
      },
      base: {
        vars: {
          [underline]: colors.base.accentBg,
          [focus]: colors.base.focus,
        },
      },
    },
  },
  defaultVariants: { variant: 'default' },
});
