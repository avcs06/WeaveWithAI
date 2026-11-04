import { tokens } from '@packages/styles/tokens.css';
import { globalStyle, style, styleVariants } from '@vanilla-extract/css';

// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- the icon size a Button's slot reads.
import { buttonIconSize } from '../Button/Button.css';

const colors = tokens.color.base;

// Over the box's text cursor; disabled, the box's default stays.
export const selectTrigger = style({
  selectors: {
    '&:not([data-disabled])': {
      cursor: 'pointer',
    },
  },
});

export const selectPlaceholder = style({ color: colors.fgMuted });

// Room for a few characters after the tags; wraps below that.
export const selectSearch = style({
  width: '6ch',
  border: 'none',
  font: 'inherit',
  color: 'inherit',
  background: 'transparent',
  outline: 'none',
});

globalStyle(`${selectSearch}::placeholder`, {
  color: colors.fgMuted,
  opacity: 1,
});

export const selectLineBox = style({
  height: '1lh',
});

// The clear button as big as the chevron beside it, its X 4px smaller.
export const selectClear = styleVariants(
  { sm: tokens.spacing[4.5], md: tokens.spacing[5] },
  (size) => ({
    selectors: {
      // Over the Button recipe's size, which triples its class.
      '&&&&': {
        padding: tokens.spacing[0.5],
        vars: { [buttonIconSize]: `calc(${size} - ${tokens.spacing[1]})` },
      },
    },
  }),
);

export const selectMenu = style({
  width: 'var(--radix-dropdown-menu-trigger-width)',
  // Over Menu's own bounds: the trigger's width decides.
  selectors: {
    '&&': {
      minWidth: 0,
      maxWidth: 'none',
    },
  },
});

export const selectMenuMessage = style({
  fontSize: tokens.fontSize.label,
  lineHeight: tokens.lineHeight[3.5],
  color: colors.fgMuted,
});
