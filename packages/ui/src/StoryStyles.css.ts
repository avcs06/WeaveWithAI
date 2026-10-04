import { tokens } from '@packages/styles/tokens.css';
import { style } from '@vanilla-extract/css';
// font-mono
export const mono = style({ fontFamily: tokens.fontFamily.mono });
// text-[11px]
export const tinyText = style({ fontSize: '11px' });
// uppercase
export const uppercase = style({ textTransform: 'uppercase' });
// tracking-[0.08em]
export const trackedText = style({ letterSpacing: '0.08em' });
// text-zinc-500
export const mutedText = style({ color: tokens.color.base.fgMuted });
// max-w-[1280px]
export const wideCanvas = style({ maxWidth: '1280px' });
// grid-cols-1
export const singleColumn = style({
  gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
});
// md:grid-cols-3
export const mediumThreeColumns = style({
  '@media': {
    '(min-width: 768px)': { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' },
  },
});
// border-0
export const borderless = style({ borderWidth: 0 });
// bg-transparent
export const transparent = style({ background: 'transparent' });
// outline-none
export const outlineReset = style({
  outline: '2px solid transparent',
  outlineOffset: '2px',
});
// w-60
export const fieldWidth = style({ width: `calc(${tokens.spacing[12]} * 5)` });
// font-medium
export const mediumWeight = style({ fontWeight: tokens.fontWeight.medium });
// text-zinc-900
export const strongText = style({ color: tokens.color.base.fg });
// text-zinc-700
export const secondaryText = style({ color: tokens.color.base.fgMuted });
// w-[320px]
export const popoverWidth = style({ width: '320px' });
// text-sm
export const smallText = style({ fontSize: tokens.fontSize.label });
// rounded-1.5
export const controlRadius = style({ borderRadius: tokens.radius.control });
// border
export const border = style({ borderWidth: '1px' });
// border-zinc-300
export const borderColor = style({ borderColor: tokens.color.base.border });
// rounded-2
export const panelRadius = style({ borderRadius: tokens.radius.surface });
// border-dashed
export const dashedBorder = style({ borderStyle: 'dashed' });
// text-xs
export const caption = style({ fontSize: tokens.fontSize.caption });
// max-w-[1200px]
export const canvas = style({ maxWidth: '1200px' });
// md:grid-cols-2
export const mediumTwoColumns = style({
  '@media': {
    '(min-width: 768px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
  },
});
// xl:grid-cols-3
export const largeThreeColumns = style({
  '@media': {
    '(min-width: 1280px)': { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' },
  },
});
// font-semibold
export const semibold = style({ fontWeight: tokens.fontWeight.semibold });
// grid-cols-3
export const threeColumns = style({
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
});
export const topMargin = style({ marginTop: tokens.spacing[0.25] });
export const bottomMargin = style({ marginBottom: tokens.spacing[0.5] });
// Section titles in StorySection
export const sectionTitle = style({
  margin: 0,
  fontSize: tokens.fontSize.body,
  fontWeight: tokens.fontWeight.semibold,
});
