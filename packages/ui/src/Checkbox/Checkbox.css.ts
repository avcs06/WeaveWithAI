import { tokens } from '@packages/styles/tokens.css';
import { borderShadow, disabledColor, focusRing } from '@packages/styles/utils';
import { createVar, globalStyle, style } from '@vanilla-extract/css';

const colors = tokens.color.base;
const transition = '120ms ease';
const dropShadow = tokens.boxShadow.control;

export const checkedBg = createVar('checkboxCheckedBg');
export const checkedHoverBg = createVar('checkboxCheckedHoverBg');
export const checkedBorder = createVar('checkboxCheckedBorder');
export const checkedFg = createVar('checkboxCheckedFg');
export const uncheckedFocus = createVar('checkboxUncheckedFocus');
export const checkedFocus = createVar('checkboxCheckedFocus');
export const iconSize = createVar('checkboxIconSize');

const checked = ':is([data-state="checked"], [data-state="indeterminate"])';
const enabled = ':not([data-disabled])';

/** The box; its color scheme sets the checked colors and focus rings. */
export const checkboxBox = style({
  padding: tokens.spacing[0.5],
  borderRadius: tokens.radius[1.5],
  color: checkedFg,
  background: colors.bg,
  boxShadow: `${borderShadow(colors.border)}, ${dropShadow}`,
  outline: 'none',
  cursor: 'pointer',
  transition: `background-color ${transition}, box-shadow ${transition}`,
  selectors: {
    [`&${enabled}:hover`]: { background: colors.hoverBg },
    [`&${enabled}:focus-visible`]: {
      background: colors.hoverBg,
      ...focusRing(uncheckedFocus, dropShadow),
    },
    [`&${checked}`]: {
      background: checkedBg,
      boxShadow: `${borderShadow(checkedBorder)}, ${dropShadow}`,
    },
    [`&${checked}${enabled}:hover`]: { background: checkedHoverBg },
    [`&${checked}${enabled}:focus-visible`]: {
      background: checkedHoverBg,
      ...focusRing(checkedFocus, dropShadow),
    },
    '&[data-disabled]': {
      boxShadow: borderShadow(disabledColor(colors.border)),
      cursor: 'default',
    },
    // Disabled with a reason, it keeps its tab stop: its focus shows, dimmed.
    '&[data-disabled]:focus-visible': focusRing(disabledColor(uncheckedFocus)),
    [`&${checked}[data-disabled]:focus-visible`]: focusRing(
      disabledColor(checkedFocus),
    ),
    [`&${checked}[data-disabled]`]: {
      color: disabledColor(checkedFg),
      background: disabledColor(checkedBg),
      boxShadow: borderShadow(disabledColor(checkedBg)),
    },
  },
});

globalStyle(`${checkboxBox} > [data-slot='icon']`, {
  width: iconSize,
  height: iconSize,
});
