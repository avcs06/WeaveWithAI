import { tokens } from '@packages/styles/tokens.css';
import { globalStyle, style } from '@vanilla-extract/css';

// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- Button takes its colors from these vars.
import { buttonFg } from '../Button/Button.css';

export const fieldButton = style({
  vars: { [buttonFg]: tokens.color.base.fgMuted },
});

export const searchField = style({});

// The field's own clear button replaces the browser's.
globalStyle(`${searchField} input::-webkit-search-cancel-button`, {
  appearance: 'none',
});
