import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/** How the picture fills its box: `cover` fills it and crops what overflows; `contain` shows all of it, leaving room on two sides. */
export type ImageFit = 'cover' | 'contain';

export type ImageProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> & {
  /** The picture's address. Without one, or when it fails to load, the box shows an image icon instead. */
  src?: string;
  /** What the picture shows, for people who can't see it; "" when it only decorates. */
  alt: string;
  /** The box's width in px. In a narrower parent it narrows and keeps its ratio. */
  width: number;
  /** The box's height in px at its full width. */
  height: number;
  fit: ImageFit;
  /** Content laid over the picture, such as a hero's headline: the picture becomes the box's background. */
  children?: ReactNode;
};
