import { tokens } from '@packages/styles/tokens.css';
import { borderShadow, disabledColor, focusRing } from '@packages/styles/utils';
import { createVar, globalStyle, style } from '@vanilla-extract/css';

import { buttonStyle } from './buttonStyle';

import type { StyleRule } from '@vanilla-extract/css';

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
const buttonBaseStyles: StyleRule = {
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
    // A button pressed by keyboard keeps focus while it loads or disables.
    '&[data-disabled]:focus-visible': {
      ...focusRing(disabledColor(buttonFocusColor)),
    },
  },
};

export const buttonBase = style(buttonBaseStyles);

export const buttonAppearance = style(
  buttonStyle({
    ...buttonBaseStyles,
    textDecoration: 'none',
  }),
);

globalStyle(
  `${buttonBase} > [data-slot='icon'], ${buttonAppearance} > [data-slot='icon']`,
  {
    width: buttonIconSize,
    height: buttonIconSize,
  },
);
