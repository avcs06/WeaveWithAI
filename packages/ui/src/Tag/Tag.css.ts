import { tokens } from '@packages/styles/tokens.css';
import { disabledColor } from '@packages/styles/utils';
import { createVar, globalStyle, style } from '@vanilla-extract/css';

export const tagFg = createVar('tagFg');
export const tagBg = createVar('tagBg');
export const tagBorder = createVar('tagBorder');
export const tagIconSize = createVar('tagIconSize');
export const tagCloseGap = createVar('tagCloseGap');
export const tagClosePadding = createVar('tagClosePadding');

export const tag = style({
  borderRadius: tokens.radius.control,
  fontWeight: tokens.fontWeight.medium,
  color: tagFg,
  background: tagBg,
  selectors: {
    '&[data-closable]': {
      paddingRight: tagCloseGap,
    },
    '&[data-disabled]': {
      color: disabledColor(tagFg),
      background: disabledColor(tagBg),
    },
  },
});

globalStyle(`${tag} > [data-slot='icon']`, {
  width: tagIconSize,
  height: tagIconSize,
});

// Square around its icon; its padding is pulled in so the tag stays padding +
// line height.
export const tagClose = style({
  selectors: {
    // Button's rules repeat its class three times; four outrank an `as`
    // target's classes.
    '&&&&': {
      paddingBlock: tagClosePadding,
      paddingInline: tagClosePadding,
      marginBlock: `calc(-1 * ${tagClosePadding})`,
      marginLeft: `calc(-1 * ${tagClosePadding} + ${tokens.spacing[0.75]})`,
    },
  },
});
