import { tokens } from '@packages/styles/tokens.css';
import {
  createVar,
  fallbackVar,
  style,
  styleVariants,
} from '@vanilla-extract/css';

import type { ImageFit } from './Image.types';

export const width = createVar();
export const ratio = createVar();
export const picture = createVar();

export const box = style({
  width: `min(100%, ${width})`,
  aspectRatio: ratio,
  background: tokens.color.base.hoverBg,
});

const sizes: Record<ImageFit, string> = { cover: 'cover', contain: 'contain' };

export const backgrounds = styleVariants(sizes, (size) => ({
  backgroundImage: fallbackVar(picture, 'none'),
  backgroundSize: size,
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
}));

export const icon = style({
  // Never wider than half of a small box.
  width: `min(${tokens.iconSize.display}, 50%)`,
  color: tokens.color.base.fgMuted,
});
