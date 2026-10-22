import { tokens } from '@packages/styles/tokens.css';
import { borderShadow, disabledColor, focusRing } from '@packages/styles/utils';
import { createVar, globalStyle, style } from '@vanilla-extract/css';

export const buttonFg = createVar('buttonFg');
export const buttonHoverFg = createVar('buttonHoverFg');
export const buttonBg = createVar('buttonBg');
export const buttonHoverBg = createVar('buttonHoverBg');
export const buttonBorder = createVar('buttonBorder');
export const buttonHoverBorder = createVar('buttonHoverBorder');
export const buttonFocusColor = createVar('buttonFocusColor');
export const buttonIconSize = createVar('buttonIconSize');

const transition = '140ms ease';

/** Behavior and states shared by every button look; colors come from the vars. */
export const buttonBase = style({
  maxWidth: '100%',
  borderRadius: tokens.radius.control,
  fontWeight: tokens.fontWeight.medium,
  whiteSpace: 'nowrap',
  userSelect: 'none',
  color: buttonFg,
  background: buttonBg,
  boxShadow: borderShadow(buttonBorder),
  outline: 'none',
  transition: `background-color ${transition}, color ${transition}, box-shadow ${transition}`,
  selectors: {
    '&:not([data-disabled]):hover': {
      color: buttonHoverFg,
      background: buttonHoverBg,
      boxShadow: borderShadow(buttonHoverBorder),
    },
    // An open Dropdown or Popover keeps its trigger looking pressed.
    '&:not([data-disabled]):is(:focus-visible, :active, [data-state="open"])': {
      color: buttonHoverFg,
      background: buttonHoverBg,
      ...focusRing(buttonFocusColor),
    },
    '&[data-disabled]': {
      color: disabledColor(buttonFg),
      background: disabledColor(buttonBg),
      boxShadow: borderShadow(disabledColor(buttonBorder)),
      cursor: 'default',
    },
  },
});

globalStyle(`${buttonBase} [data-slot='icon']`, {
  width: buttonIconSize,
  height: buttonIconSize,
});

export const buttonLabel = style({
  textAlign: 'left',
});
