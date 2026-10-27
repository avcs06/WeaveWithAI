import { tokens } from '@packages/styles/tokens.css';
import { borderShadow, disabledColor } from '@packages/styles/utils';
import { recipe } from '@vanilla-extract/recipes';

import {
  tag,
  tagFg,
  tagBg,
  tagBorder,
  tagCloseGap,
  tagIconSize,
  tagClosePadding,
} from './Tag.css';

const colors = tokens.color;

const colorSet = (fg: string, bg: string, border: string) => ({
  vars: { [tagFg]: fg, [tagBg]: bg, [tagBorder]: border },
});

const statusColors = (status: 'success' | 'warning' | 'error' | 'info') =>
  colorSet(colors[status].fg, colors[status].bg, colors[status].border);

export const tagRecipe = recipe({
  base: tag,
  variants: {
    variant: {
      default: colorSet(colors.fg, colors.bg, colors.border),
      accent: colorSet(colors.accentFg, colors.accentBg, colors.accentBorder),
      base: colorSet(colors.base.fg, colors.base.hoverBg, colors.base.border),
      success: statusColors('success'),
      warning: statusColors('warning'),
      error: statusColors('error'),
      info: statusColors('info'),
    },
    size: {
      // 24px tall: 4px padding + 16px line height + 4px padding.
      xs: {
        gap: tokens.spacing[1.5],
        paddingBlock: tokens.spacing[1],
        paddingInline: tokens.spacing[2],
        fontSize: tokens.fontSize.label,
        lineHeight: tokens.lineHeight.label,
        vars: {
          [tagClosePadding]: tokens.spacing[0.5],
          [tagIconSize]: tokens.iconSize.label,
          [tagCloseGap]: tokens.spacing[0.5],
        },
      },
      // 32px tall: 6px padding + 20px line height + 6px padding.
      sm: {
        gap: tokens.spacing[2],
        paddingBlock: tokens.spacing[1.5],
        paddingInline: tokens.spacing[2.5],
        fontSize: tokens.fontSize.body,
        lineHeight: tokens.lineHeight.body,
        vars: {
          [tagClosePadding]: tokens.spacing[1],
          [tagIconSize]: tokens.iconSize.body,
          [tagCloseGap]: tokens.spacing[0.75],
        },
      },
    },
    bordered: {
      true: {
        boxShadow: borderShadow(tagBorder),
        selectors: {
          '&[data-disabled]': {
            boxShadow: borderShadow(disabledColor(tagBorder)),
          },
        },
      },
      false: {},
    },
  },
  defaultVariants: { variant: 'base', size: 'sm', bordered: true },
});
