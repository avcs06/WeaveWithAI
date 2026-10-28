import { tokens } from '@packages/styles/tokens.css';
import { focusRing } from '@packages/styles/utils';
import { globalStyle, style } from '@vanilla-extract/css';

const colors = tokens.color.base;
const spacing = tokens.spacing;

// A divider between sections only: a lone Collapsible draws none.
export const accordionItem = style({
  selectors: {
    '&:not(:first-child)': { borderTop: `1px solid ${colors.divider}` },
  },
});

// A size below Section's heading: a list of questions, not of page parts.
export const accordionTitle = style({
  fontSize: tokens.fontSize.subheading,
  fontWeight: tokens.fontWeight.subheading,
  lineHeight: tokens.lineHeight.subheading,
  color: colors.fg,
});

export const accordionTrigger = style({ outline: 'none' });

globalStyle(`${accordionTrigger} > [data-slot='icon']`, {
  width: tokens.iconSize.subheading,
  height: tokens.iconSize.subheading,
});

// The heading's button covers the whole header strip, out to the item's
// padding, so a press anywhere on it toggles; the header's actions sit above.
const header = `${accordionItem} > [data-slot='header']`;
const actions = `${header} > [data-slot='header-actions']`;

globalStyle(header, { position: 'relative' });

globalStyle(`${accordionTrigger}::after`, {
  content: '""',
  position: 'absolute',
  inset: `calc(-1 * ${spacing[5]})`,
});

// The focus ring's shape: around the header, inside the item's frame.
globalStyle(`${accordionTrigger}::before`, {
  content: '""',
  position: 'absolute',
  inset: `calc(-1 * ${spacing[3]})`,
  borderRadius: tokens.radius.control,
  pointerEvents: 'none',
});

globalStyle(
  `${accordionTrigger}:focus-visible::before`,
  focusRing(tokens.color.focus),
);

// As tall as the title's line, so the chevron centers on it.
globalStyle(actions, { minHeight: tokens.lineHeight.subheading });

globalStyle(`${actions} > :not([data-slot='chevron'])`, {
  position: 'relative',
  zIndex: 1,
});

globalStyle(`${actions} > [data-slot='chevron']`, {
  width: tokens.iconSize.subheading,
  height: tokens.iconSize.subheading,
  color: colors.fgMuted,
  transition: 'transform 150ms ease',
  '@media': {
    '(prefers-reduced-motion: reduce)': { transition: 'none' },
  },
});

globalStyle(
  `${accordionItem}[data-state='open'] > [data-slot='header'] > [data-slot='header-actions'] > [data-slot='chevron']`,
  { transform: 'rotate(180deg)' },
);
