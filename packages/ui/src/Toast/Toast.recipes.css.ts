import { tokens } from '@packages/styles/tokens.css';
import { recipe } from '@vanilla-extract/recipes';

import { statusBg, statusFg, toastStatus } from './Toast.css';

const colors = tokens.color;

export const toastStatusRecipe = recipe({
  base: toastStatus,
  variants: {
    status: {
      success: {
        vars: {
          [statusBg]: colors.success.bg,
          [statusFg]: colors.success.fg,
        },
      },
      error: {
        vars: {
          [statusBg]: colors.error.bg,
          [statusFg]: colors.error.fg,
        },
      },
      warning: {
        vars: {
          [statusBg]: colors.warning.bg,
          [statusFg]: colors.warning.fg,
        },
      },
      info: {
        vars: {
          [statusBg]: colors.info.bg,
          [statusFg]: colors.info.fg,
        },
      },
      loading: {
        vars: {
          [statusBg]: colors.base.hoverBg,
          [statusFg]: colors.accentBg,
        },
      },
    },
  },
  defaultVariants: { status: 'info' },
});
