import { tokens } from '@packages/styles/tokens.css';
import { keyframes, style } from '@vanilla-extract/css';

const enterFrom = (x: string, y: string) =>
  keyframes({
    from: { opacity: 0, transform: `translate(${x}, ${y})` },
    to: { opacity: 1, transform: 'translate(0, 0)' },
  });

const colors = tokens.color.base;
const offset = tokens.spacing[0.5];
const entrance = '400ms cubic-bezier(0.16, 1, 0.3, 1)';

const enterAbove = `${enterFrom('0', offset)} ${entrance}`;
const enterBelow = `${enterFrom('0', `-${offset}`)} ${entrance}`;
const enterLeft = `${enterFrom(offset, '0')} ${entrance}`;
const enterRight = `${enterFrom(`-${offset}`, '0')} ${entrance}`;

export const tooltip = style({
  zIndex: tokens.zIndex.tooltip,
  maxWidth: '280px',
  paddingBlock: tokens.spacing[2.5],
  paddingLeft: tokens.spacing[3.5],
  paddingRight: tokens.spacing[4],
  borderRadius: tokens.radius.surface,
  fontSize: tokens.fontSize.caption,
  fontWeight: tokens.fontWeight.medium,
  lineHeight: tokens.lineHeight.caption,
  overflowWrap: 'anywhere',
  userSelect: 'none',
  // A modal menu disables body pointer events; the tooltip must still stay open
  // under the pointer.
  pointerEvents: 'auto',
  color: colors.accentFg,
  background: colors.accentBg,
  // No border: a light line around the dark surface reads as a focus ring.
  boxShadow: tokens.boxShadow.tooltip,
  '@media': {
    '(prefers-reduced-motion: no-preference)': {
      selectors: {
        // Slides in from the trigger, by `data-side`.
        '&[data-state$="open"][data-side="top"]': { animation: enterAbove },
        '&[data-state$="open"][data-side="bottom"]': { animation: enterBelow },
        '&[data-state$="open"][data-side="left"]': { animation: enterLeft },
        '&[data-state$="open"][data-side="right"]': { animation: enterRight },
      },
    },
  },
});
