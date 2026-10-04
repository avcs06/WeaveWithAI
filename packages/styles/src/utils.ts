// eslint-disable-next-line
import { colorTokens } from '../../../colors';

// Plain module (not .css.ts) so these functions can be exported and called
// from .css.ts and .recipes.ts files at build time.

const borderWidth = '0.75px';
const disabledMix = '50%';

/** Border drawn inside the element with box-shadow, so it never changes size. */
export const borderShadow = (color: string) =>
  `0 0 0 ${borderWidth} ${color} inset`;

/**
 * Disabled version of a color: mixed halfway into the base background, so it
 * looks like `opacity: 0.5` on the page without stacking transparent layers.
 */
export const disabledColor = (color: string) =>
  `color-mix(in srgb, ${color} ${disabledMix}, ${colorTokens.base.bg})`;
