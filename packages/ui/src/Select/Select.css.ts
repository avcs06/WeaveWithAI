import { tokens } from '@packages/styles/tokens.css';
import { globalStyle, style } from '@vanilla-extract/css';

const colors = tokens.color.base;

export const selectTrigger = style({ cursor: 'pointer' });

export const selectPlaceholder = style({ color: colors.fgMuted });

// Room for a few characters after the tags; wraps to its own line before
// it gets any narrower.
export const selectSearch = style({
  width: '6ch',
  padding: 0,
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

// As wide as the trigger, whatever the menu's own bounds.
export const selectMenu = style({
  width: 'var(--radix-dropdown-menu-trigger-width)',
  minWidth: 0,
  maxWidth: 'none',
});

export const selectMenuMessage = style({
  fontSize: tokens.fontSize.label,
  lineHeight: tokens.lineHeight[3.5],
  color: colors.fgMuted,
});
