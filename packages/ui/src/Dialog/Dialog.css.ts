import { tokens } from '@packages/styles/tokens.css';
import { borderShadow, bottomBorderShadow } from '@packages/styles/utils';
import { createVar, globalStyle, style } from '@vanilla-extract/css';

const colors = tokens.color.base;
const spacing = tokens.spacing;
const phone = '(max-width: 639px)';

export const dialogWidth = createVar('dialogWidth');
export const glyphBg = createVar('dialogGlyphBg');
export const glyphFg = createVar('dialogGlyphFg');

export const dialogOverlay = style({
  zIndex: tokens.zIndex.modal,
  background: colors.backdrop,
  opacity: 0.5,
});

/** The surface: centered, and docked to the bottom on phones. */
export const dialogSurface = style({
  zIndex: tokens.zIndex.modal,
  margin: 'auto',
  width: `min(${dialogWidth}, calc(100vw - ${spacing[8]}))`,
  maxHeight: `calc(100dvh - ${spacing[8]})`,
  borderRadius: tokens.radius.surface,
  color: colors.fg,
  background: colors.bg,
  boxShadow: `${borderShadow(colors.divider)}, ${tokens.boxShadow.modal}`,
  outline: 'none',
  '@media': {
    [phone]: {
      top: 'auto',
      right: spacing[4],
      bottom: spacing[4],
      left: spacing[4],
      width: 'auto',
      margin: 0,
    },
  },
});

export const dialogHeader = style({
  paddingTop: spacing[6],
  paddingInline: spacing[6],
  paddingBottom: spacing[2],
});

export const dialogTitle = style({
  fontSize: tokens.fontSize.subheading,
  fontWeight: tokens.fontWeight.semibold,
  lineHeight: tokens.lineHeight.subheading,
  color: colors.fg,
});

globalStyle(`${dialogTitle} > [data-slot='icon']`, {
  width: tokens.iconSize.subheading,
  height: tokens.iconSize.subheading,
});

export const dialogDescription = style({
  fontSize: tokens.fontSize.body,
  lineHeight: tokens.lineHeight.body,
  color: colors.fgMuted,
});

export const dialogBody = style({
  paddingTop: spacing[5],
  paddingInline: spacing[6],
  paddingBottom: spacing[6],
  fontSize: tokens.fontSize.body,
  lineHeight: tokens.lineHeight.body,
});

export const dialogFooter = style({
  paddingTop: spacing[2],
  paddingInline: spacing[6],
  paddingBottom: spacing[6],
  selectors: {
    '[data-slot="header"] + &': { paddingTop: spacing[6] },
  },
  '@media': {
    [phone]: {
      selectors: {
        // Two classes outrank the row's layout class. Reversed so the main
        // action, last in the row, is on top.
        '&&': { flexDirection: 'column-reverse', alignItems: 'stretch' },
      },
    },
  },
});

globalStyle(`${dialogFooter}${dialogFooter} > * > *`, {
  '@media': { [phone]: { textAlign: 'center' } },
});

// The body's scrollbar mounts only while it overflows: lines then set off the
// header and footer.
const scrolling = `${dialogSurface}:has(> [data-slot="body"] > [data-slot="scrollbar"][data-orientation="vertical"])`;

globalStyle(`${scrolling} > [data-slot="header"]`, {
  paddingBottom: spacing[4],
  boxShadow: bottomBorderShadow(colors.divider),
});

globalStyle(`${scrolling} [data-slot="body-content"]`, {
  paddingBlock: spacing[4],
});

globalStyle(`${scrolling} > [data-slot="footer"]`, {
  paddingTop: spacing[4],
  boxShadow: `0 ${spacing[0.25]} 0 0 ${colors.divider} inset`,
});

export const confirmationSurface = style({
  paddingBlock: spacing[4],
  paddingInline: spacing[5],
});

globalStyle(`${confirmationSurface} > [data-slot="footer"]`, {
  padding: 0,
  paddingTop: spacing[6],
});

export const confirmationText = style({ paddingTop: spacing[2] });

export const confirmationGlyph = style({
  width: spacing[10],
  height: spacing[10],
  borderRadius: tokens.radius.full,
  color: glyphFg,
  background: glyphBg,
});

globalStyle(`${confirmationGlyph} > svg`, {
  width: tokens.iconSize.subheading,
  height: tokens.iconSize.subheading,
});
