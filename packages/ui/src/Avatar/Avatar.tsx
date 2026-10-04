'use client';

import { classNames } from '@packages/styles/classNames';
import React, {
  type ComponentPropsWithoutRef,
  useEffect,
  useRef,
  useState,
} from 'react';

import { Tooltip } from '../Tooltip';

import { avatarImage } from './Avatar.css';
import { avatarRecipe } from './Avatar.recipes.css';

import type { RecipeVariants } from '@vanilla-extract/recipes';

type AvatarRecipeVariants = NonNullable<RecipeVariants<typeof avatarRecipe>>;

export type AvatarProps = ComponentPropsWithoutRef<'span'> &
  AvatarRecipeVariants & {
    name: string;
    src?: string;
  };

const getInitials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  return (
    words
      .slice(0, 2)
      // By code point, so a letter outside the BMP (𝓐, emoji) stays whole.
      .map((word) => Array.from(word)[0])
      .join('')
      .toUpperCase()
  );
};

/**
 * Whether `src` failed to load. An image can fail before hydration, when
 * React doesn't see its error event, so a settled image is checked too:
 * `decode()` rejects for a broken one.
 */
const useImageFailed = (src: string | undefined) => {
  const ref = useRef<HTMLImageElement>(null);
  const [failedSrc, setFailedSrc] = useState<string>();

  useEffect(() => {
    const image = ref.current;
    // jsdom has no `decode`.
    if (image?.complete) image.decode?.().catch(() => setFailedSrc(src));
  }, [src]);

  return {
    ref,
    failed: src !== undefined && failedSrc === src,
    onError: () => setFailedSrc(src),
  };
};

/**
 * Hidden from assistive tech by default: it usually sits beside the visible
 * name. Pass `aria-hidden={false}` when it stands for the person on its own.
 */
export const Avatar = ({
  name,
  src,
  size,
  className,
  'aria-hidden': ariaHidden = true,
  ...props
}: AvatarProps) => {
  const image = useImageFailed(src);
  const showImage = src !== undefined && !image.failed;
  const avatarClassName = avatarRecipe({ size });

  return (
    <Tooltip tooltip={name}>
      <span
        // Initials stand for the person: the whole avatar is one image.
        role={showImage ? undefined : 'img'}
        aria-label={showImage ? undefined : name}
        // An image with no name would fail assistive tech: hidden instead.
        aria-hidden={ariaHidden || !name.trim() || undefined}
        {...props}
        className={classNames(
          avatarClassName,
          'inline-flex-row-gap-0 items-center justify-center shrink-0',
          className,
        )}
      >
        {showImage ? (
          <img
            ref={image.ref}
            src={src}
            alt={name}
            onError={image.onError}
            className={avatarImage}
          />
        ) : (
          <span aria-hidden>{getInitials(name)}</span>
        )}
      </span>
    </Tooltip>
  );
};
