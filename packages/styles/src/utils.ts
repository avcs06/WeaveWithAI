// eslint-disable-next-line
import { colorTokens } from '../../../colors';

import {
  ringBlur,
  ringGap,
  ringGlow,
  ringOpacity,
  ringWidth,
} from './focusRing.css';

// Plain module, not .css.ts, so .css.ts and .recipes.ts files can call these
// at build time.

const borderWidth = '1px';
const disabledMix = '50%';

/** Border drawn inside the element with box-shadow, so it never changes size. */
export const borderShadow = (color: string) =>
  `0 0 0 ${borderWidth} ${color} inset`;

/** `borderShadow` on the bottom side only; `width` for a heavier line. */
export const bottomBorderShadow = (color: string, width = borderWidth) =>
  `0 -${width} 0 0 ${color} inset`;

/**
 * The focus ring in `color` (a control's variable), to spread into its focus
 * rule. `shadows` are the control's own, drawn above the ring.
 */
export const focusRing = (color: string, ...shadows: string[]) => {
  const ring = `color-mix(in srgb, ${color} ${ringOpacity}, transparent)`;
  return {
    boxShadow: [
      ...shadows,
      borderShadow(color),
      `0 0 ${ringBlur} ${ringGlow} ${ring}`,
    ].join(', '),
    // An outline, so the gap shows whatever is behind the control.
    outline: `${ringWidth} solid ${ring}`,
    outlineOffset: ringGap,
  };
};

/**
 * Disabled color: mixed halfway into the base background, like `opacity: 0.5`
 * without stacking transparent layers.
 */
export const disabledColor = (color: string) =>
  `color-mix(in srgb, ${color} ${disabledMix}, ${colorTokens.base.bg})`;
