import { tokens } from '@packages/styles/tokens.css';
import { recipe } from '@vanilla-extract/recipes';

import {
  buttonBase,
  buttonBg,
  buttonBorder,
  buttonFg,
  buttonFocusColor,
  buttonHoverBg,
  buttonHoverBorder,
  buttonHoverFg,
  buttonIconSize,
} from './Button.css';

const colors = tokens.color;
const spacing = tokens.spacing;

const colorSet = (
  fg: string,
  hoverFg: string,
  bg: string,
  hoverBg: string,
  border: string,
  hoverBorder: string,
  focusColor: string,
) => ({
  vars: {
    [buttonFg]: fg,
    [buttonHoverFg]: hoverFg,
    [buttonBg]: bg,
    [buttonHoverBg]: hoverBg,
    [buttonBorder]: border,
    [buttonHoverBorder]: hoverBorder,
    [buttonFocusColor]: focusColor,
  },
});

export const buttonVariantStyles = {
  default: colorSet(
    colors.accentFg,
    colors.accentFg,
    colors.accentBg,
    colors.accentHoverBg,
    colors.accentBorder,
    colors.accentBorder,
    colors.accentFocus,
  ),
  base: colorSet(
    colors.base.fg,
    colors.base.fg,
    colors.base.bg,
    colors.base.hoverBg,
    colors.base.border,
    colors.base.border,
    colors.base.focus,
  ),
  danger: colorSet(
    colors.error.accentFg,
    colors.error.accentFg,
    colors.error.accentBg,
    colors.error.accentHoverBg,
    colors.error.accentBorder,
    colors.error.accentBorder,
    colors.error.accentFocus,
  ),
};

export const buttonSizeStyles = {
  // 32px tall: 6px padding + 20px line height + 6px padding.
  sm: {
    gap: spacing[2],
    paddingBlock: spacing[1.5],
    paddingInline: spacing[2],
    fontSize: tokens.fontSize.body,
    lineHeight: tokens.lineHeight.body,
    vars: { [buttonIconSize]: tokens.iconSize.body },
  },
  // 40px tall: 8px padding + 24px line height + 8px padding.
  md: {
    gap: spacing[2.5],
    paddingBlock: spacing[2],
    paddingInline: spacing[3],
    fontSize: tokens.fontSize.subheading,
    lineHeight: tokens.lineHeight.subheading,
    vars: { [buttonIconSize]: tokens.iconSize.subheading },
  },
  // 24px square: 4px padding + 16px icon + 4px padding.
  'icon-xs': {
    padding: spacing[1],
    lineHeight: tokens.lineHeight[0],
    vars: { [buttonIconSize]: tokens.iconSize.body },
  },
  // 32px square: 7px padding + 18px icon + 7px padding; no token is 7px.
  'icon-sm': {
    padding: '7px',
    lineHeight: tokens.lineHeight[0],
    vars: { [buttonIconSize]: tokens.iconSize.subheading },
  },
  // 40px square: 8px padding + 24px icon + 8px padding.
  'icon-md': {
    padding: spacing[2],
    lineHeight: tokens.lineHeight[0],
    vars: { [buttonIconSize]: tokens.iconSize.heading },
  },
};

export const buttonRoundedStyle = { borderRadius: tokens.radius.full };

// Borderless until hovered; stays transparent when disabled.
export const buttonGhostStyle = {
  vars: {
    [buttonBg]: 'transparent',
    [buttonBorder]: 'transparent',
  },
  selectors: {
    '&[data-disabled]': {
      background: 'transparent',
      boxShadow: 'none',
    },
  },
};

// Accent text is for filled backgrounds, so a ghost takes its color set's
// default colors.
const ghostColors = (
  fg: string,
  hoverFg: string,
  hoverBg: string,
  hoverBorder: string,
  focusColor: string,
) =>
  colorSet(
    fg,
    hoverFg,
    'transparent',
    hoverBg,
    'transparent',
    hoverBorder,
    focusColor,
  );

export const buttonRecipe = recipe({
  base: buttonBase,
  variants: {
    variant: buttonVariantStyles,
    size: buttonSizeStyles,
    rounded: { true: buttonRoundedStyle, false: {} },
    ghost: { true: buttonGhostStyle, false: {} },
  },
  compoundVariants: [
    {
      variants: { variant: 'default', ghost: true },
      style: ghostColors(
        colors.fg,
        colors.accentFg,
        colors.accentBg,
        colors.accentBorder,
        colors.accentFocus,
      ),
    },
    {
      variants: { variant: 'danger', ghost: true },
      style: ghostColors(
        colors.error.fg,
        colors.error.accentFg,
        colors.error.accentBg,
        colors.error.accentBorder,
        colors.error.accentFocus,
      ),
    },
  ],
  defaultVariants: {
    variant: 'default',
    size: 'sm',
    rounded: false,
    ghost: false,
  },
});
