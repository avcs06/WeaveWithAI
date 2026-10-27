import { tokens } from '@packages/styles/tokens.css';
import { recipe } from '@vanilla-extract/recipes';

import {
  offFocus,
  onBg,
  onFocus,
  onHoverBg,
  onThumb,
  switchTrack,
  thumbSize,
  trackPadding,
  trackWidth,
} from './Switch.css';

const colors = tokens.color;
const spacing = tokens.spacing;

export const switchRecipe = recipe({
  base: switchTrack,
  variants: {
    variant: {
      default: {
        vars: {
          [onBg]: colors.accentBg,
          [onHoverBg]: colors.accentHoverBg,
          [onThumb]: colors.accentFg,
          [offFocus]: colors.focus,
          [onFocus]: colors.accentFocus,
        },
      },
      base: {
        vars: {
          [onBg]: colors.base.accentBg,
          [onHoverBg]: colors.base.accentHoverBg,
          [onThumb]: colors.base.accentFg,
          [offFocus]: colors.base.focus,
          [onFocus]: colors.base.accentFocus,
        },
      },
    },
    size: {
      sm: {
        height: spacing[6],
        vars: {
          [trackWidth]: spacing[10.5],
          [trackPadding]: spacing[0.75],
          [thumbSize]: spacing[4.5],
        },
      },
      md: {
        height: spacing[8],
        vars: {
          [trackWidth]: spacing[14],
          [trackPadding]: spacing[1],
          [thumbSize]: spacing[6],
        },
      },
    },
  },
  defaultVariants: { variant: 'default', size: 'sm' },
});
