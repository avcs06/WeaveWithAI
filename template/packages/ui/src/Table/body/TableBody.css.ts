import { tokens } from '@packages/styles/tokens.css';
import { globalStyle, keyframes, style } from '@vanilla-extract/css';

import { root } from '../Table.css';

export const messageCell = style({
  color: tokens.color.base.fgMuted,
});

const pulse = keyframes({
  '0%, 100%': { opacity: 1 },
  '50%': { opacity: 0.4 },
});

// A text-height bar; its width is set per cell.
export const skeleton = style({
  height: tokens.spacing[3],
  borderRadius: tokens.radius[1],
  background: tokens.color.surface.skeleton,
  animation: `${pulse} 1.6s ease-in-out infinite`,
  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
  },
});

// Stale rows while new ones load. Not `inert`: it would take focus from a
// control inside, which keeping them mounted saves.
export const staleRows = style({
  opacity: 0.5,
  pointerEvents: 'none',
});

// Radix scrollbars overlay the scroll area's edges on a transparent track.
// Padding the scroll area itself (not the viewport) per visible scrollbar ends
// the viewport at it, so rows never scroll beneath. The header matches the
// vertical one.
const bodyScrollArea = `${root} [data-slot="table-body"]`;
globalStyle(`${bodyScrollArea}:has(> [data-orientation="vertical"])`, {
  paddingRight: tokens.spacing[3.5],
});
globalStyle(`${bodyScrollArea}:has(> [data-orientation="horizontal"])`, {
  paddingBottom: tokens.spacing[3.5],
});

// No scroll anchoring: it would undo scrolling when virtualized rows above the
// view change.
globalStyle(`${bodyScrollArea} > [data-slot="viewport"]`, {
  overflowAnchor: 'none',
});
