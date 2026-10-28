import { tokens } from '@packages/styles/tokens.css';
import { recipe } from '@vanilla-extract/recipes';

import {
  confirmationGlyph,
  dialogSurface,
  dialogWidth,
  glyphBg,
  glyphFg,
} from './Dialog.css';

const colors = tokens.color;

export const dialogRecipe = recipe({
  base: dialogSurface,
  variants: {
    size: {
      sm: { vars: { [dialogWidth]: '400px' } },
      md: { vars: { [dialogWidth]: '520px' } },
      lg: { vars: { [dialogWidth]: '720px' } },
    },
  },
  defaultVariants: { size: 'md' },
});

export const glyphRecipe = recipe({
  base: confirmationGlyph,
  variants: {
    status: {
      error: {
        vars: { [glyphBg]: colors.error.bg, [glyphFg]: colors.error.fgMuted },
      },
      warning: {
        vars: {
          [glyphBg]: colors.warning.bg,
          [glyphFg]: colors.warning.fgMuted,
        },
      },
      info: {
        vars: { [glyphBg]: colors.info.bg, [glyphFg]: colors.info.fgMuted },
      },
    },
  },
  defaultVariants: { status: 'warning' },
});
