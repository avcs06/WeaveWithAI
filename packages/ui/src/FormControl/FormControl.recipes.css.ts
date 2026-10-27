import { tokens } from '@packages/styles/tokens.css';
import {
  borderShadow,
  bottomBorderShadow,
  disabledColor,
  focusRing,
} from '@packages/styles/utils';
import { recipe } from '@vanilla-extract/recipes';

import {
  controlBorder,
  controlBox,
  controlFocus,
  controlIconSize,
  controlLineHeight,
  controlPaddingX,
  controlPaddingY,
} from './FormControl.css';

const colors = tokens.color;
const spacing = tokens.spacing;

// While the control has focus, while the box is pressed, and while its menu
// is open: focus moves into the menu then.
const focused =
  '&:not([data-disabled]):is(:focus-within, :active, [data-state="open"])';
// A disabled field with a reason keeps its tab stop: its focus shows, dimmed.
const focusedDisabled = '&[data-disabled]:focus-within';

export const formControlRecipe = recipe({
  base: controlBox,
  variants: {
    variant: {
      default: {
        vars: {
          [controlBorder]: colors.base.border,
          [controlFocus]: colors.focus,
        },
      },
      base: {
        vars: {
          [controlBorder]: colors.base.border,
          [controlFocus]: colors.base.focus,
        },
      },
    },
    // The line height is an IconButton's size, so one fits in the box without
    // growing it: `xs` (24px) in sm, `sm` (32px) in md.
    size: {
      // 32px tall: 4px padding + 24px line height + 4px padding.
      sm: {
        minHeight: spacing[8],
        gap: spacing[2],
        vars: {
          [controlPaddingY]: spacing[1],
          [controlPaddingX]: spacing[2],
          [controlLineHeight]: tokens.lineHeight[6],
          [controlIconSize]: tokens.iconSize.body,
        },
      },
      // 40px tall: 4px padding + 32px line height + 4px padding.
      md: {
        minHeight: spacing[10],
        gap: spacing[2.5],
        vars: {
          [controlPaddingY]: spacing[1],
          [controlPaddingX]: spacing[3],
          [controlLineHeight]: tokens.lineHeight[8],
          [controlIconSize]: tokens.iconSize.subheading,
        },
      },
    },
    border: {
      outline: {
        borderRadius: tokens.radius.control,
        boxShadow: borderShadow(controlBorder),
        selectors: {
          [focused]: focusRing(controlFocus),
          '&[data-disabled]': {
            boxShadow: borderShadow(disabledColor(controlBorder)),
          },
          [focusedDisabled]: focusRing(disabledColor(controlFocus)),
        },
      },
      // Square, with a bottom border that focus makes 2px in the focus color.
      open: {
        borderRadius: 0,
        boxShadow: bottomBorderShadow(controlBorder),
        selectors: {
          [focused]: {
            boxShadow: bottomBorderShadow(controlFocus, spacing[0.5]),
          },
          '&[data-disabled]': {
            boxShadow: bottomBorderShadow(disabledColor(controlBorder)),
          },
          [focusedDisabled]: {
            boxShadow: bottomBorderShadow(
              disabledColor(controlFocus),
              spacing[0.5],
            ),
          },
        },
      },
    },
  },
  defaultVariants: { variant: 'default', size: 'sm', border: 'outline' },
});
