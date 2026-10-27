import { tokens } from '@packages/styles/tokens.css';
import { focusRing } from '@packages/styles/utils';
import { style } from '@vanilla-extract/css';

const colors = tokens.color.base;
const transition = '120ms ease';

export const viewport = style({
  // Clips absolutely placed content too, like visually hidden text, which
  // would otherwise widen the page.
  position: 'relative',
  borderRadius: 'inherit',
  outline: 'none',
  selectors: {
    '&:focus-visible': focusRing(tokens.color.focus),
  },
});

// Over the content's edge on a transparent track: it takes no room.
export const scrollbar = style({
  padding: tokens.spacing[0.5],
  userSelect: 'none',
  touchAction: 'none',
  selectors: {
    '&[data-orientation="vertical"]': { width: tokens.spacing[2.5] },
    '&[data-orientation="horizontal"]': { height: tokens.spacing[2.5] },
  },
});

export const thumb = style({
  borderRadius: tokens.radius.full,
  background: colors.border,
  transition: `background-color ${transition}`,
  selectors: {
    '&:hover, &:active': { background: colors.fgMuted },
  },
});
