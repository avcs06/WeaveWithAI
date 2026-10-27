import { tokens } from '@packages/styles/tokens.css';
import { disabledColor, focusRing } from '@packages/styles/utils';
import { createVar, style } from '@vanilla-extract/css';

export const cardText = createVar('cardText');
export const cardBg = createVar('cardBg');
export const cardBgHover = createVar('cardBgHover');
export const cardBgActive = createVar('cardBgActive');
export const cardBorder = createVar('cardBorder');
export const cardShadow = createVar('cardShadow');
export const cardActiveText = createVar('cardActiveText');
export const cardActiveBg = createVar('cardActiveBg');
export const cardActiveBgHover = createVar('cardActiveBgHover');
export const cardActiveBorder = createVar('cardActiveBorder');
export const cardActiveBoxShadow = createVar('cardActiveBoxShadow');
export const cardFocusColor = createVar('cardFocusColor');
export const cardActiveFocusColor = createVar('cardActiveFocusColor');

export const card = style({
  paddingInline: tokens.spacing[5],
  paddingBlock: tokens.spacing[4],
  borderRadius: tokens.radius.surface,
  border: '1px solid',
  borderColor: cardBorder,
  background: cardBg,
  color: cardText,
  boxShadow: cardShadow,
  outline: 'none',
  transition:
    'background 140ms ease, border-color 140ms ease, box-shadow 140ms ease',
  selectors: {
    '&[data-clickable]:not([data-disabled])': {
      cursor: 'pointer',
    },
    '&[data-clickable]:not([data-disabled]):hover': {
      background: cardBgHover,
    },
    '&[data-clickable]:not([data-disabled]):active': {
      background: cardBgActive,
    },
    '&:focus-visible': {
      ...focusRing(cardFocusColor, cardShadow),
    },
    '&[data-state="checked"]': {
      color: cardActiveText,
      background: cardActiveBg,
      borderColor: cardActiveBorder,
      boxShadow: `${cardActiveBoxShadow}, ${cardShadow}`,
    },
    '&[data-state="checked"]:not([data-disabled]):hover': {
      background: cardActiveBgHover,
    },
    '&[data-state="checked"]:focus-visible': {
      ...focusRing(cardActiveFocusColor, cardActiveBoxShadow, cardShadow),
    },
    '&[data-disabled]': {
      color: disabledColor(cardText),
      background: disabledColor(cardBg),
      borderColor: disabledColor(cardBorder),
      cursor: 'default',
    },
    '&[data-disabled][data-state="checked"]': {
      color: disabledColor(cardActiveText),
      background: disabledColor(cardActiveBg),
      borderColor: disabledColor(cardActiveBorder),
      boxShadow: `inset 0 0 0 1px ${disabledColor(cardActiveBorder)}, ${cardShadow}`,
    },
  },
});
