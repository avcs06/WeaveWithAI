import { tokens } from '@packages/styles/tokens.css';
import { globalStyle, keyframes, style } from '@vanilla-extract/css';

import { root } from '../Table.css';

export const messageCell = style({
  color: tokens.color.base.fgMuted,
  textAlign: 'center',
});

const pulse = keyframes({
  '0%, 100%': { opacity: 1 },
  '50%': { opacity: 0.4 },
});

// A text-height bar; its width is set per cell.
export const skeleton = style({
  height: tokens.spacing[3],
  borderRadius: tokens.radius[1],
  background: tokens.color.base.skeleton,
  animation: `${pulse} 1.6s ease-in-out infinite`,
  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
  },
});

// Rows out of date while new ones load. Not `inert`: that would take focus
// from a control inside them, which is what keeping them mounted saves.
export const staleRows = style({
  opacity: 0.5,
  pointerEvents: 'none',
});

// Radix scrollbars sit over the scroll area's edges on a transparent track.
// Padding the scroll area itself (not the viewport) for each scrollbar that
// shows ends the viewport at the scrollbar, so rows never scroll beneath it.
// The header matches the vertical one.
const bodyScrollArea = `${root} [data-slot="table-body"]`;
globalStyle(`${bodyScrollArea}:has(> [data-orientation="vertical"])`, {
  paddingRight: tokens.spacing[3.5],
});
globalStyle(`${bodyScrollArea}:has(> [data-orientation="horizontal"])`, {
  paddingBottom: tokens.spacing[3.5],
});

// Scroll anchoring stays off: it would undo scrolling whenever virtualized
// rows above the view change.
globalStyle(`${bodyScrollArea} > [data-slot="viewport"]`, {
  overflowAnchor: 'none',
});
