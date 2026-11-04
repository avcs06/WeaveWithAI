import { tokens } from '@packages/styles/tokens.css';
import { globalStyle, style } from '@vanilla-extract/css';

// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- Button takes its colors and icon size from these vars.
import { buttonFg, buttonIconSize } from '../Button/Button.css';
// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- the box's size, which the theme may change, sets the button's.
import { buttonStyle } from '../Button/buttonStyle';
// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- the box's line height and icon size, set by its size.
import {
  controlIconSize,
  controlLineHeight,
} from '../FormControl/FormControl.css';

// As tall and wide as the box's line, with the box's icon size, whatever size
// the theme gives the box: 24px in sm, 32px in md.
export const fieldButton = style(
  buttonStyle({
    width: controlLineHeight,
    height: controlLineHeight,
    padding: 0,
    vars: {
      [buttonFg]: tokens.color.base.fgMuted,
      [buttonIconSize]: controlIconSize,
    },
  }),
);

export const searchField = style({});

// Sized by its number, not its parent: three digits, centered between the buttons.
export const quantityField = style({});

globalStyle(`${quantityField} input`, {
  flex: '0 0 auto',
  width: '3ch',
  textAlign: 'center',
});

// Replaces the browser's clear button.
globalStyle(`${searchField} input::-webkit-search-cancel-button`, {
  appearance: 'none',
});
