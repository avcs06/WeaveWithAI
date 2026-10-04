import { tokens } from '@packages/styles/tokens.css';
import { recipe } from '@vanilla-extract/recipes';

import {
  cardText,
  cardBg,
  cardBgHover,
  cardBgActive,
  cardBorder,
  cardFocusBoxShadow,
  cardShadow,
  cardActiveText,
  cardActiveBg,
  cardActiveBgHover,
  cardActiveBorder,
  cardActiveBoxShadow,
  cardActiveFocusBoxShadow,
  card,
} from './Card.css';

const colors = tokens.color;
const controlShadow = tokens.controlShadow;

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
        [cardActiveFocusBoxShadow]: `${activeBorder(colors.accentBorder)}, ${controlShadow.focus}`,
      },
    },
    base: {
      vars: {
        [cardActiveText]: colors.base.fg,
        [cardActiveBg]: colors.base.bg,
        [cardActiveBgHover]: colors.base.hoverBg,
        [cardActiveBorder]: colors.base.accentBorder,
        [cardActiveBoxShadow]: activeBorder(colors.base.accentBorder),
        [cardActiveFocusBoxShadow]: `${activeBorder(colors.base.accentBorder)}, ${controlShadow.base.focus}`,
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
        [cardActiveFocusBoxShadow]: `${activeBorder(colors.accentBorder)}, ${controlShadow.accentFocus}`,
      },
    },
    base: {
      vars: {
        [cardActiveText]: colors.base.accentFg,
        [cardActiveBg]: colors.base.accentBg,
        [cardActiveBgHover]: colors.base.accentHoverBg,
        [cardActiveBorder]: colors.base.accentBorder,
        [cardActiveBoxShadow]: activeBorder(colors.base.accentBorder),
        [cardActiveFocusBoxShadow]: `${activeBorder(colors.base.accentBorder)}, ${controlShadow.base.accentFocus}`,
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
          [cardFocusBoxShadow]: controlShadow.focus,
        },
      },
      base: {
        vars: {
          [cardText]: colors.base.fg,
          [cardBg]: colors.base.bg,
          [cardBgHover]: colors.base.hoverBg,
          [cardBgActive]: colors.base.hoverBg,
          [cardBorder]: colors.base.divider,
          [cardFocusBoxShadow]: controlShadow.base.focus,
        },
      },
      ghost: {
        vars: {
          [cardText]: colors.base.fg,
          [cardBg]: 'transparent',
          [cardBgHover]: colors.base.hoverBg,
          [cardBgActive]: colors.base.hoverBg,
          [cardBorder]: 'transparent',
          [cardFocusBoxShadow]: controlShadow.base.focus,
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
    {
      variants: { variant: 'ghost', selection: 'outline' },
      style: cardSelections.outline.base,
    },
    {
      variants: { variant: 'ghost', selection: 'filled' },
      style: cardSelections.filled.base,
    },
  ],
  defaultVariants: {
    variant: 'default',
    selection: 'outline',
    elevated: true,
  },
});
