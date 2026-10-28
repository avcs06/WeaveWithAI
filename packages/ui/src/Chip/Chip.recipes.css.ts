import { tokens } from '@packages/styles/tokens.css';
import { recipe } from '@vanilla-extract/recipes';

// eslint-disable-next-line import-rules/barrel-only-sibling-imports
import { buttonBase, buttonFocusColor } from '../Button/Button.css';
// eslint-disable-next-line import-rules/barrel-only-sibling-imports
import {
  buttonGhostStyle,
  buttonRoundedStyle,
  buttonSizeStyles,
  buttonVariantStyles,
} from '../Button/Button.recipes.css';

import {
  chip,
  chipGroupCollapsed,
  chipActiveBg,
  chipActiveBorder,
  chipActiveFg,
  chipActiveFocusColor,
  chipActiveHoverBg,
} from './Chip.css';

const colors = tokens.color;

const activeColorSet = (
  fg: string,
  bg: string,
  hoverBg: string,
  border: string,
  focusColor: string,
) => ({
  vars: {
    [chipActiveFg]: fg,
    [chipActiveBg]: bg,
    [chipActiveHoverBg]: hoverBg,
    [chipActiveBorder]: border,
    [chipActiveFocusColor]: focusColor,
  },
});

// Neutral at rest like base; the variant shows when active or focused.
const chipVariantStyles = {
  default: {
    vars: {
      ...buttonVariantStyles.base.vars,
      [buttonFocusColor]: colors.focus,
    },
  },
  base: buttonVariantStyles.base,
};

const activeStyles = {
  outline: {
    default: activeColorSet(
      colors.fg,
      colors.base.bg,
      colors.base.hoverBg,
      colors.accentBorder,
      colors.focus,
    ),
    base: activeColorSet(
      colors.base.fg,
      colors.base.bg,
      colors.base.hoverBg,
      colors.base.accentBorder,
      colors.base.focus,
    ),
  },
  filled: {
    default: activeColorSet(
      colors.accentFg,
      colors.accentBg,
      colors.accentHoverBg,
      colors.accentBorder,
      colors.accentFocus,
    ),
    base: activeColorSet(
      colors.base.accentFg,
      colors.base.accentBg,
      colors.base.accentHoverBg,
      colors.base.accentBorder,
      colors.base.accentFocus,
    ),
  },
};

export const chipRecipe = recipe({
  base: [buttonBase, chip],
  variants: {
    variant: chipVariantStyles,
    selection: { outline: {}, filled: {} },
    size: { sm: buttonSizeStyles.sm, md: buttonSizeStyles.md },
    rounded: { true: buttonRoundedStyle, false: {} },
    ghost: { true: buttonGhostStyle, false: {} },
  },
  compoundVariants: [
    {
      variants: { variant: 'default', selection: 'outline' },
      style: activeStyles.outline.default,
    },
    {
      variants: { variant: 'default', selection: 'filled' },
      style: activeStyles.filled.default,
    },
    {
      variants: { variant: 'base', selection: 'outline' },
      style: activeStyles.outline.base,
    },
    {
      variants: { variant: 'base', selection: 'filled' },
      style: activeStyles.filled.base,
    },
  ],
  defaultVariants: {
    variant: 'default',
    selection: 'outline',
    size: 'sm',
    rounded: false,
    ghost: false,
  },
});

export const chipGroupRecipe = recipe({
  variants: {
    collapsed: { true: chipGroupCollapsed, false: {} },
  },
  defaultVariants: { collapsed: false },
});
