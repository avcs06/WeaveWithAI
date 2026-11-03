import { tokens } from '@packages/styles/tokens.css';
import { focusRing } from '@packages/styles/utils';
import { globalStyle, style, styleVariants } from '@vanilla-extract/css';

import type { TextColor, TextFont } from './Typography.types';

const colors = tokens.color;
const space = tokens.spacing;

const families: Record<TextFont, string> = {
  ui: tokens.fontFamily.ui,
  display: tokens.fontFamily.display,
  mono: tokens.fontFamily.mono,
};

export const fonts = styleVariants(families, (fontFamily) => ({ fontFamily }));

export const textColors = styleVariants<Record<TextColor, { color: string }>>({
  default: { color: colors.surface.pageFg },
  muted: { color: colors.surface.pageFgMuted },
  primary: { color: colors.primary.fg },
  success: { color: colors.success.fg },
  warning: { color: colors.warning.fg },
  error: { color: colors.error.fg },
  info: { color: colors.info.fg },
});

// Every text element has the body's size and line height, whatever it sits in.
const body = {
  fontSize: tokens.fontSize.body,
  lineHeight: tokens.lineHeight.body,
};

export const paragraph = style(body);

// Smaller than the body, so it reads as a note on the text beside it.
export const caption = style({
  fontSize: tokens.fontSize.caption,
  lineHeight: tokens.lineHeight.caption,
});

export const list = style({
  ...body,
  paddingInlineStart: space[5],
});

export const bulleted = style({
  listStyleType: 'disc',
});

export const numbered = style({
  listStyleType: 'decimal',
});

export const listItem = style({
  paddingInlineStart: space[1],
  selectors: { '& + &': { marginTop: space[1] } },
});

// A list inside an item starts under the item's own text.
globalStyle(`${listItem} > ${list}`, { marginTop: space[1] });

export const descriptionList = style({
  ...body,
  gridTemplateColumns: 'fit-content(50%) minmax(0, 1fr)',
  columnGap: space[4],
  rowGap: space[2],
});

// A div around a term and its details, as HTML allows, keeps them in the grid's row.
globalStyle(`${descriptionList} > div`, {
  display: 'contents',
});

export const descriptionTerm = style({
  gridColumn: 1,
});

export const descriptionDetails = style({
  gridColumn: 2,
});

const boxPadding = space[4];
const markSize = tokens.iconSize.body;

// Around the quote alone, or the figure with its source: the marks in its corners, the text between them.
export const quoteBox = style({
  ...body,
  padding: boxPadding,
  paddingInline: `calc(${boxPadding} + ${markSize} + ${space[2]})`,
  borderRadius: tokens.radius.surface,
  background: colors.primary.bg,
});

export const quote = style(body);

const mark = {
  width: markSize,
  height: markSize,
  color: colors.primary.fgMuted,
};

// The icon draws a closing mark; turned around, it opens.
export const openMark = style({
  ...mark,
  insetBlockStart: boxPadding,
  insetInlineStart: boxPadding,
  transform: 'rotate(180deg)',
});

export const closeMark = style({
  ...mark,
  insetBlockEnd: boxPadding,
  insetInlineEnd: boxPadding,
});

export const quoteSource = style({
  marginTop: space[2],
  color: colors.surface.pageFgMuted,
  // Empty alt text: screen readers skip the dash.
  '::before': { content: '"- " / ""' },
});

// Inside text: it takes the text's size, and pads only sideways so the line keeps its height.
export const code = style({
  fontFamily: tokens.fontFamily.mono,
  fontSize: 'inherit',
  paddingInline: space[1],
  borderRadius: tokens.radius.control,
  background: colors.base.hoverBg,
});

export const codeBlock = style({
  ...body,
  fontFamily: tokens.fontFamily.mono,
  padding: space[3],
  borderRadius: tokens.radius.surface,
  background: colors.base.hoverBg,
  overflowX: 'auto',
  whiteSpace: 'pre',
  outline: 'none',
  selectors: { '&:focus-visible': focusRing(colors.primary.focus) },
});

// Inside text, as `code` is.
export const kbd = style({
  fontFamily: tokens.fontFamily.mono,
  fontSize: 'inherit',
  paddingInline: space[1],
  borderRadius: tokens.radius.control,
  border: `${space[0.25]} solid ${colors.base.border}`,
  background: colors.base.hoverBg,
});

// Pads only sideways, as `code` does, so the line keeps its height.
export const highlight = style({
  paddingInline: space[1],
  borderRadius: tokens.radius.control,
  background: colors.primary.bg,
});

// The browser draws a mark black on yellow; without a `color`, it keeps the text's.
export const inheritColor = style({ color: 'inherit' });

// Drawn as its background: the reset's top border on an hr would add to the line.
export const separator = style({
  border: 'none',
  background: colors.surface.divider,
});

export const horizontal = style({
  height: space[0.25],
});

export const vertical = style({
  width: space[0.25],
});
