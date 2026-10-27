import { tokens } from '@packages/styles/tokens.css';
import { borderShadow, disabledColor } from '@packages/styles/utils';
import {
  createVar,
  fallbackVar,
  globalStyle,
  style,
} from '@vanilla-extract/css';

const colors = tokens.color.base;
const transition = '120ms ease';

/** The shell's drop shadow; a surface using Menu, like a popover, sets its own. */
export const menuShadow = createVar('menuShadow');

/** The shell's top and bottom padding; a surface can move it into the list. */
export const menuShellPaddingBlock = createVar('menuShellPaddingBlock');

/** The list's top and bottom padding, inside its scroll area. */
export const menuListPaddingBlock = createVar('menuListPaddingBlock');

/** The height left where the menu opens, from the `availableHeight` prop. */
export const menuAvailableHeight = createVar('menuAvailableHeight');

// On narrow screens the margin on both sides wins over the minimum width.
const viewportWidth = `calc(100vw - 2 * ${tokens.spacing[4]})`;

export const menu = style({
  minWidth: `min(220px, ${viewportWidth})`,
  maxWidth: `min(360px, ${viewportWidth})`,
  maxHeight: `min(420px, calc(100vh - ${tokens.spacing[12]}), ${fallbackVar(menuAvailableHeight, '100vh')})`,
  paddingBlock: fallbackVar(menuShellPaddingBlock, tokens.spacing[2]),
  borderRadius: tokens.radius.surface,
  color: colors.fg,
  background: colors.bg,
  boxShadow: `${borderShadow(colors.divider)}, ${fallbackVar(menuShadow, tokens.boxShadow.dropdown)}`,
  outline: 'none',
});

// Inside the scroll area, so a surface that moves the shell's padding here
// keeps it around the content's edges (a field's focus ring at the top is
// not clipped by the viewport).
export const menuList = style({
  paddingBlock: fallbackVar(menuListPaddingBlock, '0px'),
});

// 30px tall with one line: 8px padding + 14px line height + 8px padding.
export const menuItem = style({
  marginInline: tokens.spacing[1.5],
  paddingBlock: tokens.spacing[2],
  paddingInline: tokens.spacing[2.5],
  borderRadius: tokens.radius.control,
  fontSize: tokens.fontSize.label,
  fontWeight: tokens.fontWeight.regular,
  lineHeight: tokens.lineHeight[3.5],
  userSelect: 'none',
  outline: 'none',
  cursor: 'pointer',
  transition: `background-color ${transition}`,
  selectors: {
    // A side holding an icon or a check sits nearer the row's edge.
    '&[data-left]': {
      paddingInlineStart: tokens.spacing[1.5],
    },
    '&[data-right]': {
      paddingInlineEnd: tokens.spacing[1.5],
    },
    // The fill is too faint to find alone; keyboard focus gets a ring.
    '&:not([data-disabled]):is(:hover, [data-highlighted], [data-state="open"])':
      { background: colors.hoverBg },
    '&:focus-visible': { boxShadow: borderShadow(colors.focus) },
    // Set by the shell while the pointer is in use.
    '[data-pointer] &:focus-visible': {
      boxShadow: 'none',
    },
    '&[data-disabled]': {
      color: disabledColor(colors.fg),
      cursor: 'default',
    },
  },
});

// Icons and the check are taller than the row's line; the negative margin
// keeps them from making the row taller. Add-ons keep their own height.
globalStyle(`${menuItem} > :is([data-slot='icon'], [data-slot='check'])`, {
  width: tokens.iconSize.body,
  height: tokens.iconSize.body,
  marginBlock: `calc((${tokens.lineHeight[3.5]} - ${tokens.iconSize.body}) / 2)`,
});

globalStyle(`${menuItem} > [data-slot='checkbox']`, {
  marginBlock: `calc((${tokens.lineHeight[3.5]} - ${tokens.spacing[4.5]}) / 2)`,
});

globalStyle(`${menuItem} > [data-slot='add-on']`, {
  fontWeight: tokens.fontWeight.medium,
});

// Takes no more height than the row's line, like its icons.
export const menuChevron = style({
  marginBlock: `calc((${tokens.lineHeight[3.5]} - ${tokens.spacing[4.5]}) / 2)`,
});

export const menuCheck = style({
  color: tokens.color.success.accentBg,
});

// The list's 2px gap plus this margin keeps groups 6px apart.
export const menuGroup = style({
  selectors: { '& + &': { marginTop: tokens.spacing[1] } },
});

export const menuLabel = style({
  paddingBlock: tokens.spacing[2],
  paddingInline: tokens.spacing[4],
  fontFamily: tokens.fontFamily.mono,
  fontSize: tokens.fontSize.micro,
  fontWeight: tokens.fontWeight.regular,
  lineHeight: tokens.lineHeight[3],
  textTransform: 'uppercase',
  color: colors.fgMuted,
});

export const menuSeparator = style({
  height: tokens.spacing[0.25],
  marginBlock: tokens.spacing[1],
  background: colors.divider,
});
