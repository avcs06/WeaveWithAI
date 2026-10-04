import { createVar, globalStyle, style } from '@vanilla-extract/css';

export const chipActiveText = createVar('chipActiveText');
export const chipActiveBg = createVar('chipActiveBg');
export const chipActiveBgHover = createVar('chipActiveBgHover');
export const chipActiveBoxShadow = createVar('chipActiveBoxShadow');
export const chipActiveFocusBoxShadow = createVar('chipActiveFocusBoxShadow');

export const chip = style({
  selectors: {
    '&[data-state="checked"]': {
      color: chipActiveText,
      background: chipActiveBg,
      boxShadow: chipActiveBoxShadow,
    },
    '&[data-state="checked"]:hover, &[data-state="checked"]:active': {
      background: chipActiveBgHover,
      boxShadow: chipActiveBoxShadow,
    },
    '&[data-state="checked"]:focus-visible, &[data-state="checked"][data-focus-visible="true"]':
      {
        boxShadow: chipActiveFocusBoxShadow,
      },
  },
});

globalStyle(`${chip}[data-state="checked"] [data-slot='icon']`, {
  color: chipActiveText,
});
