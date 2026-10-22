import { disabledColor, focusRing } from '@packages/styles/utils';
import { createVar, style } from '@vanilla-extract/css';

export const chipActiveFg = createVar('chipActiveFg');
export const chipActiveBg = createVar('chipActiveBg');
export const chipActiveHoverBg = createVar('chipActiveHoverBg');
export const chipActiveBorder = createVar('chipActiveBorder');
export const chipActiveFocusColor = createVar('chipActiveFocusColor');

// Thicker than a button's border, so an active chip reads as selected.
const activeBorder = (color: string) => `0 0 0 2px ${color} inset`;

/** The active look over the button look; colors come from the vars. */
export const chip = style({
  selectors: {
    '&[data-state="checked"]': {
      color: chipActiveFg,
      background: chipActiveBg,
      boxShadow: activeBorder(chipActiveBorder),
    },
    '&[data-state="checked"]:not([data-disabled]):hover': {
      color: chipActiveFg,
      background: chipActiveHoverBg,
      boxShadow: activeBorder(chipActiveBorder),
    },
    '&[data-state="checked"]:not([data-disabled]):is(:focus-visible, :active, [data-focus-visible="true"])':
      {
        color: chipActiveFg,
        background: chipActiveHoverBg,
        ...focusRing(chipActiveFocusColor, activeBorder(chipActiveBorder)),
      },
    '&[data-state="checked"][data-disabled]': {
      color: disabledColor(chipActiveFg),
      background: disabledColor(chipActiveBg),
      boxShadow: activeBorder(disabledColor(chipActiveBorder)),
    },
  },
});
