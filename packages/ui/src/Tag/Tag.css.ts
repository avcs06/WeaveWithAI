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
  maxWidth: '100%',
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

// Square around its icon. Its own padding is pulled back in: toward the
// label, and off the tag's height, so the tag stays padding + line height.
export const tagClose = style({
  selectors: {
    // Button's rules carry its class three times, so an `as` target's
    // classes can't restyle it; four outrank them.
    '&&&&': {
      paddingBlock: tagClosePadding,
      paddingInline: tagClosePadding,
      marginBlock: `calc(-1 * ${tagClosePadding})`,
      marginLeft: `calc(-1 * ${tagClosePadding} + ${tokens.spacing[0.75]})`,
    },
  },
});
