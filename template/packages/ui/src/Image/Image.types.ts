import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/** How the picture fills its box: `cover` fills it and crops what overflows; `contain` shows all of it, leaving room on two sides. */
export type ImageFit = 'cover' | 'contain';

/**
 * The box's size in px: both sides, or one, when the picture's own ratio
 * sets the other. In a narrower parent the box narrows and keeps its ratio.
 */
type ImageSize =
  | { width: number; height: number }
  | { width: number; height?: undefined }
  | { width?: undefined; height: number };

export type ImageProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> &
  ImageSize & {
    /** The picture's address. Without one, or when it fails to load, the box shows `fallbackIcon` instead. */
    src?: string;
    /** What the picture shows, for people who can't see it; "" when it only decorates. */
    alt: string;
    fit: ImageFit;
    /** The icon in the middle of the box when there is no picture, such as the icon of the record's kind. An image icon by default. */
    fallbackIcon?: ReactNode;
    /** Content laid over the picture, such as a hero's headline: the picture becomes the box's background. */
    children?: ReactNode;
  };
