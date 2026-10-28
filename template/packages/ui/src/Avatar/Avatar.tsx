'use client';

import { classNames } from '@packages/styles/classNames';
import React, { useEffect, useRef, useState } from 'react';

import { Tooltip } from '../Tooltip';

import { avatarRecipe } from './Avatar.recipes.css';

import type { AvatarProps } from './Avatar.types';

const getInitials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  return (
    [words[0], words.length > 1 ? words[words.length - 1] : '']
      // By code point, so a letter outside the BMP (𝓐, emoji) stays whole.
      .map((word) => Array.from(word)[0] ?? '')
      .join('')
      .toUpperCase()
  );
};

/**
 * Whether `src` failed to load. It can fail before hydration, missing React's
 * error event, so a settled image is checked: `decode()` rejects when broken.
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
 * A round picture of a person, or their initials without one. Hidden from
 * assistive tech by default, with no tooltip: it usually sits beside the
 * visible name. Pass `aria-hidden={false}` when it stands for the person on
 * its own, and it can be focused to show the name in a tooltip.
 *
 * @invalidAlternative img.rounded-full, Image.rounded-full
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
  const showImage = !!src && !image.failed;
  const avatarClassName = avatarRecipe({ size });

  const ref = useRef<HTMLSpanElement>(null);
  const [focusable, setFocusable] = useState(false);
  const isHidden = ariaHidden || !name.trim();

  // Inside a link or button, that control is the tab stop; a second would nest
  // controls.
  useEffect(() => {
    setFocusable(
      !isHidden &&
        !ref.current?.parentElement?.closest(
          'a[href], button, summary, [tabindex]',
        ),
    );
  }, [isHidden]);

  return (
    // Beside a visible name, a tooltip would only repeat it.
    <Tooltip tooltip={isHidden ? null : name} description={null}>
      <span
        ref={ref}
        // The photo and the initials are one image, named once.
        role="img"
        aria-label={name}
        // An image with no name would fail assistive tech: hidden instead.
        aria-hidden={isHidden || undefined}
        // Without a tab stop, keyboard users can't reach the name tooltip.
        tabIndex={focusable ? 0 : undefined}
        {...props}
        className={classNames(
          avatarClassName,
          'inline-flex-row-gap-0 items-center justify-center shrink-0',
          'overflow-hidden',
          className,
        )}
      >
        {showImage ? (
          <img
            ref={image.ref}
            src={src}
            alt=""
            data-slot="image"
            onError={image.onError}
            className="w-full h-full object-cover"
          />
        ) : (
          <span aria-hidden data-slot="initials">
            {getInitials(name)}
          </span>
        )}
      </span>
    </Tooltip>
  );
};
