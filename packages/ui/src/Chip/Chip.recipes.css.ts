import { tokens } from '@packages/styles/tokens.css';
import { disabledColor } from '@packages/styles/utils';
import { recipe } from '@vanilla-extract/recipes';

// eslint-disable-next-line import-rules/barrel-only-sibling-imports
import {
  btnActiveBoxShadow,
  btnBg,
  btnBgActive,
  btnBgHover,
  btnBoxShadow,
  btnHoverBoxShadow,
  btnText,
  button,
} from '../Button/Button.css';
// eslint-disable-next-line import-rules/barrel-only-sibling-imports
import {
  buttonDisabledVariants,
  buttonRadiusVariants,
  buttonSizeVariants,
  buttonVariants,
} from '../Button/Button.recipes.css';

import {
  chip,
  chipActiveBg,
  chipActiveBgHover,
  chipActiveBoxShadow,
  chipActiveFocusBoxShadow,
  chipActiveText,
} from './Chip.css';

const colors = tokens.color;
const controlShadow = tokens.controlShadow;

const activeBorder = (color: string) => `0 0 0 2px ${color} inset`;

// Neutral at rest like base; the variant shows when selected or focused.
const chipVariants = {
  default: {
    vars: {
      [btnText]: colors.base.fg,
      [btnBg]: colors.base.bg,
      [btnBgHover]: colors.base.hoverBg,
      [btnBgActive]: colors.base.hoverBg,
      [btnBoxShadow]: controlShadow.base.border,
      [btnHoverBoxShadow]: controlShadow.base.border,
      [btnActiveBoxShadow]: controlShadow.focus,
    },
  },
  base: buttonVariants.base,
  ghost: buttonVariants.ghost,
};

const chipDisabledVariants = {
  default: buttonDisabledVariants.base,
  base: buttonDisabledVariants.base,
  ghost: buttonDisabledVariants.ghost,
};

const chipSelections = {
  outline: {
    default: {
      vars: {
        [chipActiveText]: colors.fg,
        [chipActiveBg]: colors.base.bg,
        [chipActiveBgHover]: colors.base.hoverBg,
        [chipActiveBoxShadow]: activeBorder(colors.accentBorder),
        [chipActiveFocusBoxShadow]: `${activeBorder(colors.accentBorder)}, ${controlShadow.focus}`,
      },
    },
    base: {
      vars: {
        [chipActiveText]: colors.base.fg,
        [chipActiveBg]: colors.base.bg,
        [chipActiveBgHover]: colors.base.hoverBg,
        [chipActiveBoxShadow]: activeBorder(colors.base.accentBorder),
        [chipActiveFocusBoxShadow]: `${activeBorder(colors.base.accentBorder)}, ${controlShadow.base.focus}`,
      },
    },
  },
  filled: {
    default: {
      vars: {
        [chipActiveText]: colors.accentFg,
        [chipActiveBg]: colors.accentBg,
        [chipActiveBgHover]: colors.accentHoverBg,
        [chipActiveBoxShadow]: activeBorder(colors.accentBorder),
        [chipActiveFocusBoxShadow]: `${activeBorder(colors.accentBorder)}, ${controlShadow.accentFocus}`,
      },
    },
    base: {
      vars: {
        [chipActiveText]: colors.base.accentFg,
        [chipActiveBg]: colors.base.accentBg,
        [chipActiveBgHover]: colors.base.accentHoverBg,
        [chipActiveBoxShadow]: activeBorder(colors.base.accentBorder),
        [chipActiveFocusBoxShadow]: `${activeBorder(colors.base.accentBorder)}, ${controlShadow.base.accentFocus}`,
      },
    },
  },
};

const chipDisabledSelections = {
  outline: {
    default: {
      vars: {
        [chipActiveText]: disabledColor(colors.fg),
        [chipActiveBg]: disabledColor(colors.bg),
        [chipActiveBgHover]: disabledColor(colors.bg),
        [chipActiveBoxShadow]: activeBorder(disabledColor(colors.accentBorder)),
        [chipActiveFocusBoxShadow]: activeBorder(
          disabledColor(colors.accentBorder),
        ),
      },
    },
    base: {
      vars: {
        [chipActiveText]: disabledColor(colors.base.fg),
        [chipActiveBg]: disabledColor(colors.base.bg),
        [chipActiveBgHover]: disabledColor(colors.base.bg),
        [chipActiveBoxShadow]: activeBorder(
          disabledColor(colors.base.accentBorder),
        ),
        [chipActiveFocusBoxShadow]: activeBorder(
          disabledColor(colors.base.accentBorder),
        ),
      },
    },
  },
  filled: {
    default: {
      vars: {
        [chipActiveText]: disabledColor(colors.accentFg),
        [chipActiveBg]: disabledColor(colors.accentBg),
        [chipActiveBgHover]: disabledColor(colors.accentBg),
        [chipActiveBoxShadow]: activeBorder(disabledColor(colors.accentBorder)),
        [chipActiveFocusBoxShadow]: activeBorder(
          disabledColor(colors.accentBorder),
        ),
      },
    },
    base: {
      vars: {
        [chipActiveText]: disabledColor(colors.base.accentFg),
        [chipActiveBg]: disabledColor(colors.base.accentBg),
        [chipActiveBgHover]: disabledColor(colors.base.accentBg),
        [chipActiveBoxShadow]: activeBorder(
          disabledColor(colors.base.accentBorder),
        ),
        [chipActiveFocusBoxShadow]: activeBorder(
          disabledColor(colors.base.accentBorder),
        ),
      },
    },
  },
};

export const chipRecipe = recipe({
  base: [button, chip],
  variants: {
    disabled: {
      true: {},
      false: {},
    },
    size: {
      sm: buttonSizeVariants.sm,
      md: buttonSizeVariants.md,
    },
    radius: buttonRadiusVariants,
    variant: chipVariants,
    selection: {
      outline: {},
      filled: {},
    },
  },
  compoundVariants: [
    {
      variants: { variant: 'default', selection: 'outline' },
      style: chipSelections.outline.default,
    },
    {
      variants: { variant: 'default', selection: 'filled' },
      style: chipSelections.filled.default,
    },
    {
      variants: { variant: 'base', selection: 'outline' },
      style: chipSelections.outline.base,
    },
    {
      variants: { variant: 'base', selection: 'filled' },
      style: chipSelections.filled.base,
    },
    {
      variants: { variant: 'ghost', selection: 'outline' },
      style: chipSelections.outline.base,
    },
    {
      variants: { variant: 'ghost', selection: 'filled' },
      style: chipSelections.filled.base,
    },
    {
      variants: { variant: 'default', selection: 'outline', disabled: true },
      style: [
        chipDisabledVariants.default,
        chipDisabledSelections.outline.default,
      ],
    },
    {
      variants: { variant: 'default', selection: 'filled', disabled: true },
      style: [
        chipDisabledVariants.default,
        chipDisabledSelections.filled.default,
      ],
    },
    {
      variants: { variant: 'base', selection: 'outline', disabled: true },
      style: [chipDisabledVariants.base, chipDisabledSelections.outline.base],
    },
    {
      variants: { variant: 'base', selection: 'filled', disabled: true },
      style: [chipDisabledVariants.base, chipDisabledSelections.filled.base],
    },
    {
      variants: { variant: 'ghost', selection: 'outline', disabled: true },
      style: [chipDisabledVariants.ghost, chipDisabledSelections.outline.base],
    },
    {
      variants: { variant: 'ghost', selection: 'filled', disabled: true },
      style: [chipDisabledVariants.ghost, chipDisabledSelections.filled.base],
    },
  ],
  defaultVariants: {
    variant: 'default',
    selection: 'outline',
    size: 'sm',
    radius: 'default',
    disabled: false,
  },
});
