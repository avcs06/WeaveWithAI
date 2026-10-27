import { tokens } from '@packages/styles/tokens.css';
import { recipe } from '@vanilla-extract/recipes';

import {
  cardText,
  cardBg,
  cardBgHover,
  cardBgActive,
  cardBorder,
  cardShadow,
  cardActiveText,
  cardActiveBg,
  cardActiveBgHover,
  cardActiveBorder,
  cardActiveBoxShadow,
  cardActiveFocusColor,
  cardFocusColor,
  card,
} from './Card.css';

const colors = tokens.color;

const activeBorder = (color: string) => `inset 0 0 0 1px ${color}`;

const cardSelections = {
  outline: {
    default: {
      vars: {
        [cardActiveText]: colors.fg,
        [cardActiveBg]: colors.bg,
        [cardActiveBgHover]: colors.hoverBg,
        [cardActiveBorder]: colors.accentBorder,
        [cardActiveBoxShadow]: activeBorder(colors.accentBorder),
        [cardActiveFocusColor]: colors.focus,
      },
    },
    base: {
      vars: {
        [cardActiveText]: colors.base.fg,
        [cardActiveBg]: colors.base.bg,
        [cardActiveBgHover]: colors.base.hoverBg,
        [cardActiveBorder]: colors.base.accentBorder,
        [cardActiveBoxShadow]: activeBorder(colors.base.accentBorder),
        [cardActiveFocusColor]: colors.base.focus,
      },
    },
  },
  filled: {
    default: {
      vars: {
        [cardActiveText]: colors.accentFg,
        [cardActiveBg]: colors.accentBg,
        [cardActiveBgHover]: colors.accentHoverBg,
        [cardActiveBorder]: colors.accentBorder,
        [cardActiveBoxShadow]: activeBorder(colors.accentBorder),
        [cardActiveFocusColor]: colors.accentFocus,
      },
    },
    base: {
      vars: {
        [cardActiveText]: colors.base.accentFg,
        [cardActiveBg]: colors.base.accentBg,
        [cardActiveBgHover]: colors.base.accentHoverBg,
        [cardActiveBorder]: colors.base.accentBorder,
        [cardActiveBoxShadow]: activeBorder(colors.base.accentBorder),
        [cardActiveFocusColor]: colors.base.accentFocus,
      },
    },
  },
};

export const cardRecipe = recipe({
  base: card,
  variants: {
    variant: {
      default: {
        vars: {
          [cardText]: colors.base.fg,
          [cardBg]: colors.base.bg,
          [cardBgHover]: colors.base.hoverBg,
          [cardBgActive]: colors.base.hoverBg,
          [cardBorder]: colors.base.divider,
          [cardFocusColor]: colors.focus,
        },
      },
      base: {
        vars: {
          [cardText]: colors.base.fg,
          [cardBg]: colors.base.bg,
          [cardBgHover]: colors.base.hoverBg,
          [cardBgActive]: colors.base.hoverBg,
          [cardBorder]: colors.base.divider,
          [cardFocusColor]: colors.base.focus,
        },
      },
    },
    selection: {
      outline: {},
      filled: {},
    },
    // A transparent shadow rather than `none`, so it can join a shadow list.
    elevated: {
      true: { vars: { [cardShadow]: tokens.boxShadow.card } },
      false: { vars: { [cardShadow]: '0 0 transparent' } },
    },
    // Borderless and unfilled until hovered.
    ghost: {
      true: {
        vars: {
          [cardBg]: 'transparent',
          [cardBorder]: 'transparent',
        },
        selectors: {
          '&[data-clickable]:not([data-disabled]):not([data-state="checked"]):hover':
            {
              borderColor: colors.base.border,
            },
        },
      },
      false: {},
    },
  },
  compoundVariants: [
    {
      variants: { variant: 'default', selection: 'outline' },
      style: cardSelections.outline.default,
    },
    {
      variants: { variant: 'default', selection: 'filled' },
      style: cardSelections.filled.default,
    },
    {
      variants: { variant: 'base', selection: 'outline' },
      style: cardSelections.outline.base,
    },
    {
      variants: { variant: 'base', selection: 'filled' },
      style: cardSelections.filled.base,
    },
  ],
  defaultVariants: {
    variant: 'default',
    selection: 'outline',
    elevated: false,
    ghost: false,
  },
});
