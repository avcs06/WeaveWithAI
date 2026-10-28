import { tokens } from '@packages/styles/tokens.css';
import { borderShadow, disabledColor, focusRing } from '@packages/styles/utils';
import { createVar, globalStyle, style } from '@vanilla-extract/css';

const colors = tokens.color.base;
const transition = '120ms ease';
const dropShadow = tokens.boxShadow.control;

export const checkedBg = createVar('radioCheckedBg');
export const checkedHoverBg = createVar('radioCheckedHoverBg');
export const checkedBorder = createVar('radioCheckedBorder');
export const checkedFg = createVar('radioCheckedFg');
export const uncheckedFocus = createVar('radioUncheckedFocus');
export const checkedFocus = createVar('radioCheckedFocus');
export const dotSize = createVar('radioDotSize');

const checked = '[data-state="checked"]';
const enabled = ':not([data-disabled])';
const focused = ':is(:focus-visible, :active)';

/** The round box; its color scheme sets the checked colors and focus rings. */
export const radioBox = style({
  padding: tokens.spacing[0.25],
  borderRadius: tokens.radius.full,
  background: colors.bg,
  boxShadow: `${borderShadow(colors.border)}, ${dropShadow}`,
  outline: 'none',
  transition: `background-color ${transition}, box-shadow ${transition}`,
  selectors: {
    [`&${enabled}:hover`]: { background: colors.hoverBg },
    [`&${enabled}${focused}`]: {
      background: colors.hoverBg,
      ...focusRing(uncheckedFocus, dropShadow),
    },
    [`&${checked}`]: {
      background: checkedBg,
      boxShadow: `${borderShadow(checkedBorder)}, ${dropShadow}`,
    },
    [`&${checked}${enabled}:hover`]: { background: checkedHoverBg },
    [`&${checked}${enabled}${focused}`]: {
      background: checkedHoverBg,
      ...focusRing(checkedFocus, dropShadow),
    },
    '&[data-disabled]': {
      boxShadow: borderShadow(disabledColor(colors.border)),
      cursor: 'default',
    },
    // Disabled with a reason, it keeps its tab stop: its focus shows, dimmed.
    '&[data-disabled]:focus-visible': {
      ...focusRing(disabledColor(uncheckedFocus)),
    },
    [`&${checked}[data-disabled]:focus-visible`]: {
      ...focusRing(disabledColor(checkedFocus)),
    },
    [`&${checked}[data-disabled]`]: {
      background: disabledColor(checkedBg),
      boxShadow: borderShadow(disabledColor(checkedBg)),
    },
  },
});

globalStyle(`${radioBox} > [data-slot='dot']`, {
  width: dotSize,
  height: dotSize,
  borderRadius: tokens.radius.full,
});

globalStyle(`${radioBox}${checked} > [data-slot='dot']`, {
  background: checkedFg,
});

globalStyle(`${radioBox}${checked}[data-disabled] > [data-slot='dot']`, {
  background: disabledColor(checkedFg),
});
