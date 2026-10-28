import { tokens } from '@packages/styles/tokens.css';
import { style } from '@vanilla-extract/css';
export const mono = style({ fontFamily: tokens.fontFamily.mono });
export const tinyText = style({ fontSize: tokens.fontSize.micro });
export const uppercase = style({ textTransform: 'uppercase' });
export const trackedText = style({ letterSpacing: '0.08em' });
export const mutedText = style({ color: tokens.color.base.fgMuted });
export const wideCanvas = style({ maxWidth: '1280px' });
export const singleColumn = style({
  gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
});
export const mediumThreeColumns = style({
  '@media': {
    '(min-width: 768px)': { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' },
  },
});
export const borderless = style({ borderWidth: 0 });
export const transparent = style({ background: 'transparent' });
export const outlineReset = style({
  outline: '2px solid transparent',
  outlineOffset: '2px',
});
export const controlWidth = style({ width: `calc(${tokens.spacing[12]} * 5)` });
export const mediumWeight = style({ fontWeight: tokens.fontWeight.medium });
export const strongText = style({ color: tokens.color.base.fg });
export const secondaryText = style({ color: tokens.color.base.fgMuted });
export const popoverWidth = style({ width: '320px' });
export const smallText = style({ fontSize: tokens.fontSize.label });
export const controlRadius = style({ borderRadius: tokens.radius.control });
export const border = style({ borderWidth: '1px' });
export const borderColor = style({ borderColor: tokens.color.base.border });
export const panelRadius = style({ borderRadius: tokens.radius.surface });
export const dashedBorder = style({ borderStyle: 'dashed' });
export const caption = style({ fontSize: tokens.fontSize.caption });
export const canvas = style({ maxWidth: '1200px' });
export const mediumTwoColumns = style({
  '@media': {
    '(min-width: 768px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
  },
});
export const largeThreeColumns = style({
  '@media': {
    '(min-width: 1280px)': { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' },
  },
});
export const semibold = style({ fontWeight: tokens.fontWeight.semibold });
export const threeColumns = style({
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
});
export const topMargin = style({ marginTop: tokens.spacing[0.25] });
export const bottomMargin = style({ marginBottom: tokens.spacing[0.5] });
// Shows a box's edges, like a Section's padding.
export const outlinedBox = style({
  outline: `1px dashed ${tokens.color.base.border}`,
});
