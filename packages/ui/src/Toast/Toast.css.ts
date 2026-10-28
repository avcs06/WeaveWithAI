import { tokens } from '@packages/styles/tokens.css';
import { borderShadow } from '@packages/styles/utils';
import { createVar, globalStyle, keyframes, style } from '@vanilla-extract/css';

const colors = tokens.color.base;
const spacing = tokens.spacing;
const phone = '(max-width: 639px)';
// Past the viewport's right padding, fully off screen.
const offScreen = `translateX(calc(100% + ${spacing[4]}))`;

export const statusBg = createVar('toastStatusBg');
export const statusFg = createVar('toastStatusFg');

const slideIn = keyframes({
  from: { transform: offScreen },
  to: { transform: 'translateX(0)' },
});

const slideOut = keyframes({
  from: { transform: 'translateX(0)' },
  to: { transform: offScreen },
});

const swipeOut = keyframes({
  from: { transform: 'translateX(var(--radix-toast-swipe-end-x))' },
  to: { transform: offScreen },
});

/**
 * The stack, bottom right: it scrolls when taller than the screen. It keeps
 * 48px from the screen's top and left (16px on phones) by its size, not
 * padding, which would block presses on the page under it.
 */
export const toastViewport = style({
  zIndex: tokens.zIndex.toast,
  width: `calc(420px + ${spacing[4]})`,
  maxWidth: `calc(100vw - ${spacing[12]})`,
  maxHeight: `calc(100dvh - ${spacing[12]})`,
  paddingRight: spacing[4],
  paddingBottom: spacing[4],
  overflowY: 'auto',
  listStyle: 'none',
  outline: 'none',
  selectors: {
    // Empty, it takes no room, so it blocks nothing.
    '&:empty': { padding: 0 },
  },
  '@media': {
    [phone]: { maxWidth: `calc(100vw - ${spacing[4]})` },
  },
});

export const toastSurface = style({
  minHeight: spacing[12],
  paddingBlock: spacing[2],
  paddingLeft: spacing[2.5],
  paddingRight: spacing[2],
  borderRadius: tokens.radius.surface,
  background: colors.bg,
  boxShadow: `${borderShadow(colors.divider)}, ${tokens.boxShadow.toast}`,
  selectors: {
    '&[data-swipe="move"]': {
      transform: 'translateX(var(--radix-toast-swipe-move-x))',
    },
    '&[data-swipe="cancel"]': {
      transform: 'translateX(0)',
      transition: 'transform 120ms ease-out',
    },
  },
  '@media': {
    '(prefers-reduced-motion: no-preference)': {
      selectors: {
        '&[data-state="open"]': {
          animation: `${slideIn} 120ms cubic-bezier(0.16, 1, 0.3, 1)`,
        },
        '&[data-state="closed"]': { animation: `${slideOut} 60ms ease-in` },
        '&[data-swipe="end"]': { animation: `${swipeOut} 60ms ease-out` },
      },
    },
  },
});

export const toastText = style({
  paddingBlock: spacing[1],
});

export const toastTitle = style({
  fontSize: tokens.fontSize.body,
  fontWeight: tokens.fontWeight.medium,
  lineHeight: tokens.lineHeight.body,
  color: colors.fg,
});

export const toastDescription = style({
  fontSize: tokens.fontSize.caption,
  lineHeight: tokens.lineHeight.caption,
  color: colors.fgMuted,
});

export const toastStatus = style({
  width: spacing[7],
  height: spacing[7],
  borderRadius: tokens.radius.full,
  color: statusFg,
  background: statusBg,
});

globalStyle(`${toastStatus} > svg`, {
  width: spacing[4.5],
  height: spacing[4.5],
});
