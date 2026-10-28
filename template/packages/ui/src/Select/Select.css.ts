import { tokens } from '@packages/styles/tokens.css';
import { globalStyle, style } from '@vanilla-extract/css';

const colors = tokens.color.base;

// Over the box's text cursor; disabled, the box's default stays.
export const selectTrigger = style({
  selectors: {
    '&:not([data-disabled])': {
      cursor: 'pointer',
    },
  },
});

export const selectPlaceholder = style({ color: colors.fgMuted });

// Room for a few characters after the tags; wraps below that.
export const selectSearch = style({
  width: '6ch',
  border: 'none',
  font: 'inherit',
  color: 'inherit',
  background: 'transparent',
  outline: 'none',
});

globalStyle(`${selectSearch}::placeholder`, {
  color: colors.fgMuted,
  opacity: 1,
});

export const selectLineBox = style({
  height: '1lh',
});

export const selectMenu = style({
  width: 'var(--radix-dropdown-menu-trigger-width)',
  // Over Menu's own bounds: the trigger's width decides.
  selectors: {
    '&&': {
      minWidth: 0,
      maxWidth: 'none',
    },
  },
});

export const selectMenuMessage = style({
  fontSize: tokens.fontSize.label,
  lineHeight: tokens.lineHeight[3.5],
  color: colors.fgMuted,
});
