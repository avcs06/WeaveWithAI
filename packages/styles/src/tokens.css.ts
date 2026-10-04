// eslint-disable-next-line
import { colorTokens, type ColorSet } from '../../../colors';

// eslint-disable-next-line
import { tokens as tokenValues } from '../../../tokens';

import {
  ringAccentMix,
  ringBlur,
  ringGap,
  ringMix,
  ringWidth,
} from './focusRing.css';
import { borderShadow } from './utils';

const shadowColor = colorTokens.base.shadow;

/** Soft drop shadow: `color` at `opacity`% (defaults to the base shadow color). */
const dropShadow = (
  y: string,
  blur: string,
  opacity: number,
  color: string = shadowColor,
) => `0 ${y} ${blur} 0 color-mix(in srgb, ${color} ${opacity}%, transparent)`;

/**
 * Accent border, then a gap in the page color, then the ring; focusRing.css.ts
 * sets their sizes.
 */
const focusRing = (border: string, ring: string) =>
  `${borderShadow(border)}, 0 0 0 ${ringGap} ${colorTokens.base.bg}, 0 0 ${ringBlur} calc(${ringGap} + ${ringWidth}) ${ring}`;

/**
 * Control borders and focus ring from a color set, drawn with box-shadow so
 * they never change the element's size.
 */
const controlShadow = (set: ColorSet) => ({
  border: borderShadow(set.border),
  accentBorder: borderShadow(set.accentBorder),
  // Non-accent controls (inputs, base/ghost buttons): ring of faded accent.
  focus: focusRing(
    set.accentBorder,
    `color-mix(in srgb, ${set.accentBg} ${ringMix}, transparent)`,
  ),
  // Filled accent controls: ring of the hover background, tinted with accent.
  accentFocus: focusRing(
    set.accentBorder,
    `color-mix(in srgb, ${set.accentBg} ${ringAccentMix}, ${set.hoverBg})`,
  ),
});

export const tokens = {
  ...tokenValues,
  color: colorTokens,
  boxShadow: {
    card: dropShadow('4px', '12px', 8),
    control: dropShadow('1px', '2px', 5),
    tooltip: dropShadow('2px', '5px', 10),
    dropdown: dropShadow('4px', '12px', 8),
    popover: dropShadow('4px', '12px', 8),
    toast: dropShadow('6px', '16px', 10),
    modal: dropShadow('12px', '32px', 12),
  },
  controlShadow: {
    ...controlShadow(colorTokens),
    base: controlShadow(colorTokens.base),
    success: controlShadow(colorTokens.success),
    warning: controlShadow(colorTokens.warning),
    error: controlShadow(colorTokens.error),
    info: controlShadow(colorTokens.info),
  },
} as const;

export type Tokens = typeof tokens;
