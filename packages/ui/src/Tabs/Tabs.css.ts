import { tokens } from '@packages/styles/tokens.css';
import {
  bottomBorderShadow,
  disabledColor,
  focusRing,
} from '@packages/styles/utils';
import { createVar, globalStyle, style } from '@vanilla-extract/css';

const colors = tokens.color.base;
const spacing = tokens.spacing;
const indicator = '220ms ease';

export const underline = createVar('tabsUnderline');
export const focus = createVar('tabsFocus');

const active = '[data-state="active"]';

export const tabsList = style({
  boxShadow: bottomBorderShadow(colors.divider),
});

export const tabTrigger = style({
  height: spacing[10.5],
  paddingBlock: spacing[3.5],
  paddingInline: spacing[3],
  fontSize: tokens.fontSize.label,
  fontWeight: tokens.fontWeight.medium,
  lineHeight: tokens.lineHeight[3.5],
  letterSpacing: '0.01em',
  userSelect: 'none',
  color: colors.fgMuted,
  outline: 'none',
  selectors: {
    '&[data-state="inactive"]:not([data-disabled]):hover': {
      color: colors.fg,
    },
    [`&${active}`]: {
      color: colors.fg,
    },
    '&[data-disabled]': {
      color: disabledColor(colors.fgMuted),
      cursor: 'default',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      insetInline: 0,
      bottom: 0,
      height: spacing[0.5],
      background: underline,
      opacity: 0,
      transform: 'scaleX(0)',
      transition: `transform ${indicator}, opacity ${indicator}`,
    },
    [`&${active}::after`]: { opacity: 1, transform: 'scaleX(1)' },
    // The focus ring's shape, kept clear of the underline.
    '&::before': {
      content: '""',
      position: 'absolute',
      insetBlock: spacing[2],
      insetInline: spacing[1],
      borderRadius: tokens.radius.control,
      pointerEvents: 'none',
    },
    // Keyboard focus only: a clicked tab shows itself as active instead.
    '&:focus-visible::before': {
      ...focusRing(focus),
    },
    // Disabled with a reason, it stays focusable: its focus shows, dimmed.
    '&[data-disabled]:focus-visible::before': focusRing(disabledColor(focus)),
    // Set by the tab list while the pointer is in use.
    '[data-pointer] &:focus-visible::before': {
      outline: 'none',
      boxShadow: 'none',
    },
  },
});

globalStyle(`${tabTrigger} > [data-slot='icon']`, {
  width: tokens.iconSize.label,
  height: tokens.iconSize.label,
});
